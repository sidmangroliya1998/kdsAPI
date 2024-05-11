import {
  Injectable, NotFoundException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { CreateWasteEventDto } from './dto/create-waste-event.dto';
import { UpdateWasteEventDto } from './dto/update-waste-event.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WasteEvent, WasteEventDocument } from './schema/waste-event.schema';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';
import { QueryWasteEventDto } from './dto/query-waste-event.dto';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { WasteEventNew, WasteEventNewDocument } from './schema/waste-event-new.schema';
import { CreateWasteEventNewDto } from './dto/create-waste-event-new.dto';
import { TransStatus } from 'src/core/Constants/enum';
import { UpdateWasteEventNewDto } from './dto/update-waste-event-new.dto';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class WasteEventService {
  constructor(
    @InjectModel(WasteEvent.name)
    private readonly wasteEventModel: Model<WasteEventDocument>,
    @InjectModel(WasteEvent.name)
    private readonly wasteEventModelPag: PaginateModel<WasteEventDocument>,
    private readonly inventoryHelperService: InventoryHelperService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @Inject(forwardRef(() => UnitOfMeasureHelperService))
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,

    @InjectModel(WasteEventNew.name)
    private readonly wasteEventNewModel: Model<WasteEventNewDocument>,
    @InjectModel(WasteEventNew.name)
    private readonly wasteEventNewModelPag: PaginateModel<WasteEventNewDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateWasteEventDto,
  ): Promise<WasteEventDocument> {
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.wasteEventModel.findOne(
      {
        supplierId: req.user.supplierId,
        $expr: {
          $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
        },
      },
      {},
      {
        sort: {
          _id: -1,
        },
      },
    );
    if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('WS-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'WS-' + postFix + String(counter).padStart(5, '0');

    const wasteEvent = await this.wasteEventModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
    });
    const calculatedInventory: any =
      await this.inventoryHelperService.applyWasteEvent(wasteEvent);
    if (calculatedInventory) {
      wasteEvent.value = calculatedInventory.sourceItemWithBase.stockValue;
      wasteEvent.save();
    }
    await wasteEvent.populate([
      {
        path: 'supplierId',
      },
      {
        path: 'materialId'
      }
    ]);
    if (wasteEvent.supplierId.autoTransferWasteEventGl) {
      //Override price if material addition have exists
      const matAdd = await this.restaurantMaterialModel.findOne({
        restaurantId: wasteEvent.restaurantId,
        materialId: wasteEvent.materialId
      }).populate([{
        path: 'materialId'
      }]);

      if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            matAdd?.materialId?.uomBase?.toString(),
            wasteEvent?.uom?.toString()
          );
        wasteEvent.value = wasteEvent.quantity * convert.conversionFactor * matAdd?.overridePrice;
      }
      await this.glVoucherHelperService.handleWasteEvent(wasteEvent);
    }
    return wasteEvent;
  }

  async findAllOld(
    req: any,
    query: QueryWasteEventDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<WasteEventDocument>> {
    let queryToApply: any = {};
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }
    if (req.query.restaurantIds) {
      queryToApply.restaurantId = {
        $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }
    if (req.query.materialIds) {
      queryToApply.materialId = {
        $in: req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }
    if (req.query && req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.date = {
        $gte: startDate,
        $lte: endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
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
    if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minAmount > 0) {
        amountRangeQuery.$gte = Number(req.query.minAmount);
      }
      if (req.query.maxAmount > 0) {
        amountRangeQuery.$lte = Number(req.query.maxAmount);
      }
      queryToApply.value = amountRangeQuery;
    }
    const records = await this.wasteEventModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'supplierId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'materialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uom',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'reason',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'addedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
        ],
      },
    );
    return records;
  }

  async findOneOld(
    wasteEventId: string,
    i18n: I18nContext,
  ): Promise<WasteEventDocument> {
    const exists = await this.wasteEventModel.findById(wasteEventId);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    wasteEventId: string,
    dto: UpdateWasteEventDto,
    i18n: I18nContext,
  ): Promise<WasteEventDocument> {
    const wasteEvent = await this.wasteEventModel.findByIdAndUpdate(
      wasteEventId,
      dto,
      {
        new: true,
      },
    );

    if (!wasteEvent) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return wasteEvent;
  }

  async remove(wasteEventId: string, i18n: I18nContext): Promise<boolean> {
    const wasteEvent = await this.wasteEventModel.findByIdAndDelete(
      wasteEventId,
    );

    if (!wasteEvent) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }


  // All New Code

  async createNew(
    req: any,
    dto: CreateWasteEventNewDto,
  ): Promise<WasteEventNewDocument> {

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.wasteEventNewModel.findOne(
      {
        supplierId: req.user.supplierId,
        $expr: {
          $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
        },
      },
      {},
      {
        sort: {
          _id: -1,
        },
      },
    );
    if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('WS-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'WS-' + postFix + String(counter).padStart(5, '0');

    console.log("wasteEvent dto", dto);

    const wasteEvent = await this.wasteEventNewModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
    });


    if (dto.transType == TransStatus.Approved) {

      await this.updateApproval(req, wasteEvent._id);
      // const totalStockValue =
      //   await this.inventoryHelperService.applyWasteEventNew(wasteEvent);

      // if (totalStockValue) {
      //   wasteEvent.totalValue = totalStockValue;
      //   await wasteEvent.save();
      // }
      // await wasteEvent.populate([
      //   {
      //     path: 'supplierId',
      //   },
      //   {
      //     path: 'items.materialId'
      //   }
      // ]);
      // if (wasteEvent.supplierId.autoTransferWasteEventGl) {
      //   await this.glVoucherHelperService.handleWasteEventNew(wasteEvent);
      // }
    }
    else {
      await this.inventoryHelperService.applyWasteEventNew(wasteEvent, false);
    }

    return wasteEvent;
  }
  async updateNew(
    wasteEventId: string,
    dto: UpdateWasteEventNewDto,
    i18n: I18nContext,
  ): Promise<WasteEventNewDocument> {
    const wasteEvent = await this.wasteEventNewModel.findByIdAndUpdate(
      wasteEventId,
      dto,
      {
        new: true,
      },
    );

    if (!wasteEvent) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    await this.inventoryHelperService.applyWasteEventNew(wasteEvent, false);
    return wasteEvent;
  }
  async findAll(
    req: any,
    query: QueryWasteEventDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<WasteEventNewDocument>> {
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

    if (req.query.materialIds) {
      queryToApply['items.materialId'] = {
        $in: req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }
    if (req.query && req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.date = {
        $gte: startDate,
        $lte: endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
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
    if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minAmount > 0) {
        amountRangeQuery.$gte = Number(req.query.minAmount);
      }
      if (req.query.maxAmount > 0) {
        amountRangeQuery.$lte = Number(req.query.maxAmount);
      }
      queryToApply.totalValue = amountRangeQuery;
    }

    if (req.query && req.query.docNumber && req.query.docNumber !== '') {
      const docNumberQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$docNumber" },
            regex: req.query.docNumber,
            options: "i",
          }
        }
      };
      queryToApply = { ...queryToApply, ...docNumberQuery };
    }

    const records = await this.wasteEventNewModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'supplierId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'items.materialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'items.uom',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'reason',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'addedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
        ],
      },
    );
    return records;
  }

  async findOne(
    wasteEventId: string,
    i18n: I18nContext,
  ): Promise<WasteEventNewDocument> {
    const exists = await this.wasteEventNewModel.findById(wasteEventId).populate([
      {
        path: 'restaurantId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'supplierId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'items.materialId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'items.uom',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'reason',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'addedBy',
        select: {
          name: 1,
          _id: 1,
        },
      },
    ]);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async createScript() {

    const allWE: any = await this.wasteEventModel.find({});

    const dto = [];
    for (let i = 0; i < allWE.length; i++) {
      const el = allWE[i];
      const weDto = {
        date: el.date,
        reason: el.reason,
        restaurantId: el.restaurantId,
        supplierId: el.supplierId,
        trasferredToGl: el.trasferredToGl,
        transferredAt: el.transferredAt,
        glVoucherId: el.glVoucherId,
        addedBy: el.addedBy,
        docNumber: el.docNumber,
        items: [{ materialId: el.materialId, quantity: el.quantity, value: el.value, uom: el.uom }],
        totalValue: el.value,
        createdAt: el.createdAt
      }
      dto.push(weDto);
    }
    await this.wasteEventNewModel.insertMany(dto);

    await this.wasteEventNewModel.updateMany({}, { $set: { transType: TransStatus.Approved } });


    return true;
  }

  async updateApproval(req: any, Id: string): Promise<any> {

    const doc = await this.wasteEventNewModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.wasteEventNewModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    const totalStockValue =
      await this.inventoryHelperService.applyWasteEventNew(doc);

    if (totalStockValue) {
      doc.totalValue = totalStockValue;
      await doc.save();
    }
    await doc.populate([
      {
        path: 'supplierId',
      },
      {
        path: 'items.materialId'
      }
    ]);
    if (doc.supplierId.autoTransferWasteEventGl) {
      await this.glVoucherHelperService.handleWasteEventNew(doc);
    }

    //Update waste event count into daily inventory control report

    for (let i = 0; i < doc.items.length; i++) {
      const el = doc.items[i];
      await this.inventoryHelperService.saveInventoryControl(req,
        {
          restaurantId: doc.restaurantId,
          materialId: el.materialId,
          wasteQty: el.quantity,
          wasteValue: el.value
        });
    }

    return true;
  }
}
