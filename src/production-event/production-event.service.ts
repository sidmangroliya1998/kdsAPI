import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductionEventDto } from './dto/create-production-event.dto';
import { UpdateProductionEventDto } from './dto/update-production-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ProductionEvent,
  ProductionEventDocument,
} from './schema/production-event.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { QueryProductionEventDto } from './dto/query-production-event.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import { ProductionEventHelperService } from './production-event-helper.service';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';
import { ProductionEventNew, ProductionEventNewDocument } from './schema/production-event-new.schema';
import { CreateProductionEventNewDto } from './dto/create-production-event-new.dto';
import { TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';

@Injectable()
export class ProductionEventService {
  constructor(
    @InjectModel(ProductionEvent.name)
    private readonly productionEventModel: Model<ProductionEventDocument>,
    @InjectModel(ProductionEvent.name)
    private readonly productionEventModelPag: PaginateModel<ProductionEventDocument>,
    private readonly productionEventHelperService: ProductionEventHelperService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ProductionEventNew.name)
    private readonly productionEventNewModel: Model<ProductionEventNewDocument>,
    @InjectModel(ProductionEventNew.name)
    private readonly productionEventModelNewPag: PaginateModel<ProductionEventNewDocument>,
    private readonly inventoryHelperService: InventoryHelperService,

  ) { }

  async create(
    req: any,
    dto: CreateProductionEventDto,
    i18n: I18nContext
  ): Promise<ProductionEventDocument> {
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.productionEventModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('RP-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'RP-' + postFix + String(counter).padStart(5, '0');

    const stockAvailable = await this.productionEventHelperService.validateStockAvailable(req, dto, i18n)

    // if (!stockAvailable) {
    //   throw new BadRequestException(i18n.t('No stock available for this recipe'));
    // }

    const productionEvent = await this.productionEventModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
    });

    const preparedData = await this.productionEventHelperService.executeRecipe(
      productionEvent,
      dto,
    );
    productionEvent.set({ ...preparedData, isApplied: true });
    productionEvent.save();
    await productionEvent.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (productionEvent.supplierId.autoTransferRecipeProductionGl) {
      this.glVoucherHelperService.handleRecipeProduction(productionEvent);
    }
    return productionEvent;
  }

  async findAllOld(
    req: any,
    query: QueryProductionEventDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ProductionEventDocument>> {
    let queryToApply: any = {};
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }

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
    const records = await this.productionEventModelPag.paginate(
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
            path: 'items.baseUom',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'items.storageArea',
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
    productionEventId: string,
    i18n: I18nContext,
  ): Promise<ProductionEventDocument> {
    const exists = await this.productionEventModel.findById(productionEventId);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    productionEventId: string,
    dto: UpdateProductionEventDto,
    i18n: I18nContext,
  ): Promise<ProductionEventDocument> {
    const productionEvent = await this.productionEventModel.findByIdAndUpdate(
      productionEventId,
      dto,
      {
        new: true,
      },
    );

    if (!productionEvent) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return productionEvent;
  }

  async remove(productionEventId: string, i18n: I18nContext): Promise<boolean> {
    const productionEvent = await this.productionEventModel.findByIdAndDelete(
      productionEventId,
    );

    if (!productionEvent) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async createNew(req: any,
    dto: CreateProductionEventNewDto,
    i18n: I18nContext
  ): Promise<ProductionEventNewDocument> {

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.productionEventNewModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('RP-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'RP-' + postFix + String(counter).padStart(5, '0');

    const productionEvent = await this.productionEventNewModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
    });


    if (dto.transType == TransStatus.Approved) {
      await this.updateApproval(req, productionEvent._id);

      // const preparedData = await this.productionEventHelperService.executeRecipeNew(
      //   productionEvent,
      //   dto,
      // );
      // const totalCost = preparedData.reduce((acc, o) => {
      //   return acc + o?.itemData?.totalCost;
      // }, 0)

      // productionEvent.set({ ...preparedData, isApplied: true, totalCost: totalCost });
      // await productionEvent.save();
      // await productionEvent.populate([
      //   {
      //     path: 'supplierId',
      //   },
      // ]);


      // if (productionEvent.supplierId.autoTransferRecipeProductionGl) {
      //   await this.glVoucherHelperService.handleRecipeProductionNew(productionEvent, preparedData);
      // }
    }

    return productionEvent;

  }

  async findAll(req: any,
    query: QueryProductionEventDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ProductionEventNewDocument>> {
    let queryToApply: any = {};
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
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

    if (req.query && req.query.docNumber && req.query.docNumber !== '') {
      const poNumberQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$docNumber" },
            regex: req.query.docNumber,
            options: "i",
          }
        }
      };
      queryToApply = { ...queryToApply, ...poNumberQuery };
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

    const records = await this.productionEventModelNewPag.paginate(
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

  async findOne(productionEventId: string,
    i18n: I18nContext,
  ): Promise<ProductionEventNewDocument> {
    const exists = await this.productionEventNewModel.findById(productionEventId).populate([
      {
        path: 'restaurantId',
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

    const allPE: any = await this.productionEventModel.find({});

    let dto = [];
    for (let i = 0; i < allPE.length; i++) {
      const el = allPE[i];
      const pedto = {
        supplierId: el.supplierId,
        restaurantId: el.restaurantId,
        isApplied: el.isApplied,
        totalCost: el.totalCost,
        date: el.date,
        trasferredToGl: el.trasferredToGl,
        transferredAt: el.transferredAt,
        glVoucherId: el.glVoucherId,
        addedBy: el.addedBy,
        docNumber: el.docNumber,
        createdAt: el.createdAt,
        items: [{ materialId: el.materialId, quantity: el.quantity, uom: el.uom, cost: el.cost }]
      }
      dto.push(pedto);
    }
    await this.productionEventNewModel.insertMany(dto);

    await this.productionEventModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
    return true;
  }

  async updateApproval(req: any, Id: string): Promise<any> {

    const doc: any = await this.productionEventNewModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.productionEventNewModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    const dto: any = {
      restaurantId: doc.restaurantId
    };

    const preparedData: any = await this.productionEventHelperService.executeRecipeNew(
      doc,
      dto,
    );
    const totalCost = preparedData.reduce((acc, o) => {
      return acc + o?.itemData?.totalCost;
    }, 0)

    doc.set({ ...preparedData, isApplied: true, totalCost: totalCost });
    await doc.save();
    await doc.populate([
      {
        path: 'supplierId',
      },
    ]);


    if (doc.supplierId.autoTransferRecipeProductionGl) {
      await this.glVoucherHelperService.handleRecipeProductionNew(doc, preparedData);
    }

    // console.log("preparedData", JSON.stringify(preparedData));

    for (let i = 0; i < preparedData.length; i++) {
      const el = preparedData[i];
      for (let j = 0; j < el.itemData?.items?.length; j++) {
        const ex = el.itemData?.items[j];
        console.log("Ex", ex);
        await this.inventoryHelperService.saveInventoryControl(req,
          {
            restaurantId: doc.restaurantId,
            materialId: ex.materialId?._id,
            productionMaterialConsumeQty: ex.appliedStock,
            productionMaterialConsumeValue: ex.stockValue
          });
      }
    }
    for (let i = 0; i < doc.items.length; i++) {
      const el = doc.items[i];
      await this.inventoryHelperService.saveInventoryControl(req,
        {
          restaurantId: doc.restaurantId,
          materialId: el.materialId,
          productionCostQty: el.quantity,
          productionCostValue: el.cost
        });
    }
    return true;
  }

}
