import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Printer, PrinterDocument } from './schema/printer.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { I18nContext } from 'nestjs-i18n';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class PrinterService {
  constructor(
    @InjectModel(Printer.name)
    private readonly printerModel: Model<PrinterDocument>,
    @InjectModel(Printer.name)
    private readonly printerModelPag: PaginateModel<PrinterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(req: any, dto: CreatePrinterDto): Promise<PrinterDocument> {
    const printer = await this.printerModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
    if (dto.isDefault == true) {
      let queryToApply: any = {};
      if (dto?.availableRestaurants && dto?.availableRestaurants?.length > 0) {
        queryToApply =
        {
          availableRestaurants: { $in: dto?.availableRestaurants }
        }
      }else{
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } }
        ];
      }

      await this.printerModel.updateMany(
        {
          supplierId: printer.supplierId,
          _id: { $ne: printer._id },
          type: printer.type,
          ...queryToApply
        },
        { isDefault: false },
      );
    }
    return printer;
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PrinterDocument>> {

    let queryToApply: any = {};
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (req.query.restaurantId) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(req.query.restaurantId)] } }
        ];
      } else {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(req.query.restaurantId)] } }
        ];
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } }
        ];
      }
    }

    const printers = await this.printerModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        ...queryToApply
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

  async fetchBySupplier(supplierId): Promise<PrinterDocument[]> {
    return await this.printerModel.find({ supplierId });
  }

  async findOne(
    printerId: string,
    i18n: I18nContext,
  ): Promise<PrinterDocument> {
    const exists = await this.printerModel.findById(printerId);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    printerId: string,
    dto: UpdatePrinterDto,
    i18n: I18nContext,
  ): Promise<PrinterDocument> {
    const printer = await this.printerModel.findByIdAndUpdate(printerId, dto, {
      new: true,
    });

    if (!printer) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    if (dto.isDefault == true) {
      let queryToApply: any = {};
      if (dto?.availableRestaurants && dto?.availableRestaurants?.length > 0) {
        queryToApply =
        {
          availableRestaurants: { $in: dto?.availableRestaurants }
        }
      }else{
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } }
        ];
      }
      await this.printerModel.updateMany(
        {
          supplierId: printer.supplierId,
          _id: { $ne: printer._id },
          type: printer.type,
          ...queryToApply
        },
        { isDefault: false },
      );
    }

    return printer;
  }

  async remove(printerId: string, i18n: I18nContext): Promise<boolean> {
    const printer = await this.printerModel.findByIdAndRemove(printerId);

    if (!printer) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }
}
