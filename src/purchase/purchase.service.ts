import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { TaxIndication } from 'src/expense/enum/en';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { ExpenseReportDto } from 'src/expense/dto/expense-report.dto';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { Workbook } from 'exceljs';
import * as moment from 'moment';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Purchase.name)
    private readonly purchaseModelPag: PaginateModel<PurchaseDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(req: any, dto: CreatePurchaseDto): Promise<PurchaseDocument> {
    const purchase = await this.purchaseModel.findOne(
      {
        supplierId: req.user.supplierId,
      },
      {},
      {
        sort: {
          voucherNumber: -1,
        },
      },
    );

    for (const i in dto.items) {
      if (dto.items[i].taxIndication == TaxIndication.Included) {
        dto.items[i].net = roundOffNumber(
          dto.items[i].grossAmount / (1 + Tax.rate / 100),
        );
        dto.items[i].tax = roundOffNumber(
          dto.items[i].grossAmount - dto.items[i].net,
        );
      } else if (dto.items[i].taxIndication == TaxIndication.NotRelavant) {
        dto.items[i].net = roundOffNumber(dto.items[i].grossAmount);
        dto.items[i].tax = 0;
      } else if (dto.items[i].taxIndication == TaxIndication.NotIncluded) {
        dto.items[i].net = roundOffNumber(dto.items[i].grossAmount);
        dto.items[i].grossAmount += dto.items[i].tax ?? 0;
      }
      dto.items[i].grossAmount = roundOffNumber(dto.items[i].grossAmount);
    }
    const totalTax = dto.items.reduce((acc, o) => acc + o.tax, 0);
    const totalGross = dto.items.reduce((acc, o) => acc + o.grossAmount, 0);
    const totalNet = dto.items.reduce((acc, o) => acc + o.net, 0);

    const doc = await this.purchaseModel.create({
      ...dto,
      totalTax: totalTax,
      totalNet: totalNet,
      totalGrossAmount: totalGross,
      voucherNumber: purchase ? purchase.voucherNumber + 1 : 1,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
    await doc.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (doc.supplierId.autoTransferPurchaseGl && dto.transType == TransStatus.Approved) {
      await this.glVoucherHelperService.handlePurchase(doc);
    }
    return doc;
  }

  async findAll(
    req: any,
    query: QueryPurchaseDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PurchaseDocument>> {

    const purchases = await this.purchaseModelPag.paginate(
      { supplierId: req.user.supplierId, ...query },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return purchases;
  }

  async report(
    req: any,
    query: ExpenseReportDto,
    paginateOptions: PaginationDto = null,
    isFile = false,
  ): Promise<any> {
    let queryToApply: any = {};

    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }
    if (req.query.restaurantIds) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: { $in: getAllRest?.restaurantId } },
          { restaurantId: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
        ];
      } else {
        queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: { $in: getAllRest?.restaurantId } },
        ];
      }
    }

    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);

      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(60);

      queryToApply.date = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }
    // if (query.restaurantIds) {
    //   queryToApply.restaurantId = {
    //     $in: query.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
    //   };
    // }
    if (req.query.vendorIds) {
      queryToApply.vendorId = {
        $in: req.query.vendorIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }
    if (query.minAmount > 0 || query.maxAmount > 0) {
      const amountRangeQuery: any = {};

      if (query.minAmount > 0) {
        amountRangeQuery.$gte = Number(query.minAmount);
      }
      if (query.maxAmount > 0) {
        amountRangeQuery.$lte = Number(query.maxAmount);
      }
      queryToApply.totalGrossAmount = amountRangeQuery;
    }
    if (req.query && req.query.createdStartDate && req.query.createdEndDate) {
      const startDate = new Date(req.query.createdStartDate);
      const endDate = new Date(req.query.createdEndDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
      delete queryToApply.createdStartDate;
      delete queryToApply.createdEndDate;
    }
    if (req.query && req.query.referenceNumber && req.query.referenceNumber != '') {
      const refQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$referenceNumber" },
            regex: req.query.referenceNumber,
            options: "i",
          }
        }
      };
      queryToApply = { ...queryToApply, ...refQuery };
    }
    const purchases = await this.purchaseModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        ...queryToApply,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,

        populate: [
          {
            path: 'addedBy',
            select: { name: 1 },
          },
          {
            path: 'glVoucherId',
            select: {
              voucherNumber: 1,
            },
          },
          {
            path: 'vendorId',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
        ],

      }
    );

    const aggregateResult = await this.purchaseModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: '$totalGrossAmount',
          },
          subTotal: {
            $sum: '$totalNet',
          },
          vat: {
            $sum: '$totalTax',
          },
        },
      },
    ]);

    let response = {
      ...purchases,
      aggregateResult: aggregateResult[0]
    }
    return response;

  }

  async findOne(purchaseId: string): Promise<PurchaseDocument> {
    const exists = await this.purchaseModel.findById(purchaseId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    purchaseId: string,
    dto: UpdatePurchaseDto,
  ): Promise<PurchaseDocument> {

    let additionalDetails: any = {};

    for (const i in dto.items) {
      if (dto.items[i].taxIndication == TaxIndication.Included) {
        dto.items[i].net = roundOffNumber(
          dto.items[i].grossAmount / (1 + Tax.rate / 100),
        );
        dto.items[i].tax = roundOffNumber(
          dto.items[i].grossAmount - dto.items[i].net,
        );
      } else if (dto.items[i].taxIndication == TaxIndication.NotRelavant) {
        dto.items[i].net = roundOffNumber(dto.items[i].grossAmount);
        dto.items[i].tax = 0;
      } else if (dto.items[i].taxIndication == TaxIndication.NotIncluded) {
        dto.items[i].net = roundOffNumber(dto.items[i].grossAmount);
        dto.items[i].grossAmount += dto.items[i].tax ?? 0;
      }
      dto.items[i].grossAmount = roundOffNumber(dto.items[i].grossAmount);
    }
    if (dto.items && dto.items?.length > 0) {
      const totalTax = dto.items.reduce((acc, o) => acc + o.tax, 0);
      const totalGross = dto.items.reduce((acc, o) => acc + o.grossAmount, 0);
      const totalNet = dto.items.reduce((acc, o) => acc + o.net, 0);

      additionalDetails = {
        totalTax: totalTax,
        totalNet: totalNet,
        totalGrossAmount: totalGross,
      }
    }
    const purchase = await this.purchaseModel.findByIdAndUpdate(
      purchaseId,
      {
        ...dto,
        ...additionalDetails
      },
      {
        new: true,
      },
    );

    if (!purchase) {
      throw new NotFoundException();
    }

    return purchase;
  }

  async remove(purchaseId: string): Promise<boolean> {
    const purchase = await this.purchaseModel.findByIdAndRemove(purchaseId);

    if (!purchase) {
      throw new NotFoundException();
    }
    return true;
  }

  async restoreTotalData(supplierId: string): Promise<any> {

    const purchases = await this.purchaseModel.find({ supplierId: new mongoose.Types.ObjectId(supplierId) });

    const updatePromises = purchases.filter((f: any) => !f.totalGrossAmount || f.totalGrossAmount == 0).map(async (purchase) => {
      let totalGross = 0;
      let totalNet = 0;
      let totalTax = 0;
      for (let i = 0; i < purchase.items.length; i++) {
        const el = purchase.items[i];
        totalGross += el.grossAmount || 0;
        totalNet += el.net || 0;
        totalTax += el.tax || 0;
      }

      return this.purchaseModel.updateOne(
        { _id: purchase._id },
        {
          $set: {
            totalGrossAmount: totalGross,
            totalNet: totalNet,
            totalTax: totalTax
          }
        }
      );
    });

    // Use Promise.all to wait for all update promises to complete
    Promise.all(updatePromises)
      .then(() => {
        console.log('All purchases updated successfully.');
      })
      .catch((error) => {
        console.error('Error updating purchases:', error);
      });

  }
  async updateApproval(Id: string): Promise<any> {

    const doc = await this.purchaseModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.purchaseModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    await doc.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (doc.supplierId.autoTransferPurchaseGl) {
      await this.glVoucherHelperService.handlePurchase(doc);
    }
    return true;
  }
  async createScript() {
    await this.purchaseModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
  }

}
