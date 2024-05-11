import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult, AggregatePaginateModel, AggregatePaginateResult } from 'mongoose';
import { CreatePrinterDto } from 'src/printer/dto/create-printer.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { I18nContext } from 'nestjs-i18n';
import { Driver, DriverDocument } from './schema/driver.schema';
import { DriverSummaryDto } from './dto/driver-summary.dto';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { DriverDetailsDto } from './dto/driver-details-query.dto';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(Driver.name)
    private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Driver.name)
    private readonly driverModelPag: PaginateModel<DriverDocument>,
    @InjectModel(User.name)
    private readonly userModelAggPg: AggregatePaginateModel<UserDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Order.name)
    private readonly orderModelPag: PaginateModel<OrderDocument>,
  ) { }

  async create(req: any, dto: CreateDriverDto): Promise<DriverDocument> {
    const driver = await this.driverModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });

    return driver;
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<DriverDocument>> {
    const printers = await this.driverModelPag.paginate(
      {
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return printers;
  }

  async findOne(driverId: string, i18n: I18nContext): Promise<DriverDocument> {
    const exists = await this.driverModel.findById(driverId);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    driverId: string,
    dto: UpdateDriverDto,
    i18n: I18nContext,
  ): Promise<DriverDocument> {
    const driver = await this.driverModel.findByIdAndUpdate(driverId, dto, {
      new: true,
    });

    if (!driver) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return driver;
  }

  async remove(driverId: string, i18n: I18nContext): Promise<boolean> {
    const printer = await this.driverModel.findByIdAndRemove(driverId);

    if (!printer) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async driverSummary(
    req: any,
    query: DriverSummaryDto,
    paginateOptions: PaginationDto,
  ): Promise<[AggregatePaginateResult<UserDocument>]> {

    let match: any = {}
    let orderMatch: any = {}

    if (query.driverId) {
      match._id = new mongoose.Types.ObjectId(query.driverId);
    }

    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);
      query.startDate = new Date(
        query.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(60);
      query.endDate = new Date(
        query.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
    }

    orderMatch = {
      $and: [
        { $eq: ["$driverId", "$$driverId"] }
      ]
    }; // Basic match condition

    if (query.startDate && query.endDate) {
      orderMatch.$and.push({ $gte: ["$createdAt", query.startDate] })
      orderMatch.$and.push({ $lte: ["$createdAt", query.endDate] })
    }

    if (query.minAmount > 0 || query.maxAmount > 0) {
      const amountConditions = [];
      if (query.minAmount > 0) {
        amountConditions.push({ $gte: ["$summary.totalBeforeDiscount", Number(query.minAmount)] });
      }
      if (query.maxAmount > 0) {
        amountConditions.push({ $lte: ["$summary.totalBeforeDiscount", Number(query.maxAmount)] });
      }
      orderMatch.$and.push(...amountConditions);

    }

    if (query?.deliveryStatus) {
      orderMatch.$and.push({ $eq: ["$deliveryStatus", query.deliveryStatus] });
    }


    const drivers = await this.userModelAggPg.aggregatePaginate(
      this.userModel.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            isDriver: true,
            ...match,
          },
        },
        {
          $lookup: {
            from: "orders",
            let: { driverId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: orderMatch
                }
              },
              {
                $group: {
                  _id: '$deliveryStatus',
                  amount: { $sum: '$summary.totalBeforeDiscount' },
                  count: { $sum: 1 }
                }
              }
            ],
            as: "status"
          }
        },
        {
          $project: {
            _id: 1,
            name: 1, // Include the 'name' field from userModel
            status: 1 // Include the 'status' field from the $lookup
          }
        }
      ]),
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );


    console.log(drivers, "drivers")

    return [drivers];
  }

  async driverOrderDetails(
    req: any,
    query: DriverDetailsDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    let queryToApply: any = { ...query };


    if (query.driverId) {
      queryToApply.driverId = query.driverId;
    }

    if (query.customerId) {
      queryToApply.customerId = query.customerId;
    }

    if (query.orderNumber) {
      queryToApply.orderNumber = { $regex: query.orderNumber, $options: 'i' };
    }

    if (query.minAmount > 0 || query.maxAmount > 0) {
            const amountRangeQuery: any = {};

            if (query.minAmount > 0) {
                amountRangeQuery.$gte = Number(query.minAmount);
            }
            if (query.maxAmount > 0) {
                amountRangeQuery.$lte = Number(query.maxAmount);
            }
            queryToApply["summary.totalBeforeDiscount"] = amountRangeQuery;
      }

    if (!query.restaurantId || query.restaurantId == '') {
      const getAllRest = await this.userModel.findById(req.user.userId);
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.restaurantId = {
          $in: getAllRest?.restaurantId
        };
      }
    }

    if (query.search) {
      queryToApply.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { contactNumber: { $regex: query.search, $options: 'i' } },
        { orderNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);
      query.startDate = new Date(
        query.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(60);
      query.endDate = new Date(
        query.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );

      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (paginateOptions.pagination == false) {
      paginateOptions = {
        pagination: true,
        limit: 900,
        page: 1,
      };
    }

    const orders = await this.orderModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        'driverId': { $exists: true, $ne: null }, // Check that driverId exists and is not null
        'customerId': { $exists: true, $ne: null }, // Check that customerId exists and is not null
        ...queryToApply,
      },
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy]: paginateOptions.sortDirection
              ? paginateOptions.sortDirection
              : -1,
          }
          : DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          { path: 'customerId' },
          {
            path: 'driverId',
            select: {
              name: 1,
            }
          },
        ],
      },
    );
    return orders;
  }
}
