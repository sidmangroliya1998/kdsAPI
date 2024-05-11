import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
  BadRequestException
} from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import {
  UpdateInventoryDto,
  UpdateInventoryIdentifierDto,
} from './dto/update-inventory.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { InventoryHelperService } from './inventory-helper.service';
import { InventoryAction, TransferRequestStatus } from './enum/en';
import { QueryInventoryHistoryDto } from './dto/query-inventory-history.dto';
import {
  InventoryHistory,
  InventoryHistoryDocument,
} from './schemas/inventory-history.schema';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import {
  LowInventory,
  LowInventoryDocument,
} from './schemas/low-inventory.schema';
import {
  InventoryTransfer,
  InventoryTransferDocument,
} from './schemas/inventory-transfer.schema';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { ItemConsumption, ItemConsumptionDocument } from './schemas/item-consumption.schema';
import mongoose from 'mongoose';
import { ItemConsumptionDto } from './dto/item-consumption.dto';
import { TransferInventoryRequestDto } from './dto/transfer-inventory-req.dto';
import { InventoryTransferRequest, InventoryTransferRequestDocument } from './schemas/inventory-transfer-req.schema';
import { UpdateTransferInventoryReqDto } from './dto/transfer-inventory-req-update.dto';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { TransferInventoryNewDto } from './dto/transfer-inventory-new.dto';
import { InventoryTransferNew, InventoryTransferNewDocument } from './schemas/inventory-transfer-new.schema';
import { CreateInventoryCountValueDto } from './dto/create-inv-count-value.dto';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';
import { InvoiceReceipt, InvoiceReceiptDocument } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { MaterialType } from 'src/material/enum/en';
import { InventoryControlData, InventoryControlDataDocument } from './schemas/inventory-control.schema';
import { ProductionEventNew, ProductionEventNewDocument } from 'src/production-event/schema/production-event-new.schema';
import { Restaurant, RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { RecipeService } from 'src/recipe/recipe.service';
import { Recipe, RecipeDocument } from 'src/recipe/schema/recipe.schema';
import { AggregatePaginateModel } from 'mongoose';
import { ItemConsumptionDetail, ItemConsumptionDetailDocument } from './schemas/item-consumption-detail.schema';
import { CostOfSalesDetail, CostOfSalesDetailDocument } from './schemas/cost-of-sales.schema';
import { DefaultSortForInvControlReport, QueryInventoryControlDto } from './dto/query-inventory-control-report.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModelPag: PaginateModel<InventoryDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModelPagAgg: AggregatePaginateModel<InventoryDocument>,
    @InjectModel(InventoryHistory.name)
    private readonly inventoryHistoryModelPag: PaginateModel<InventoryHistoryDocument>,
    @InjectModel(LowInventory.name)
    private readonly lowInventoryModelPag: PaginateModel<LowInventoryDocument>,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(Material.name)
    private readonly materialModelPag: PaginateModel<MaterialDocument>,
    @InjectModel(Material.name)
    private readonly materialModelPagAgg: AggregatePaginateModel<MaterialDocument>,
    @InjectModel(InventoryTransfer.name)
    private readonly inventoryTransferModel: Model<InventoryTransferDocument>,
    @InjectModel(InventoryTransfer.name)
    private readonly inventoryTransferModelPag: PaginateModel<InventoryTransferDocument>,
    @Inject(forwardRef(() => InventoryHelperService))
    private readonly inventoryHelperService: InventoryHelperService,
    @Inject(forwardRef(() => UnitOfMeasureHelperService))
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(ItemConsumptionDetail.name)
    private readonly itemConsumptionModel: Model<ItemConsumptionDetailDocument>,
    @InjectModel(InventoryTransferRequest.name)
    private readonly inventoryTransferReqModel: Model<InventoryTransferRequestDocument>,
    @InjectModel(InventoryTransferRequest.name)
    private readonly inventoryTransferReqModelPag: PaginateModel<InventoryTransferRequestDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(InventoryTransferNew.name)
    private readonly inventoryTransferNewModel: Model<InventoryTransferNewDocument>,
    @InjectModel(InventoryTransferNew.name)
    private readonly inventoryTransferNewModelPag: PaginateModel<InventoryTransferNewDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(InventoryControlData.name)
    private readonly invControlDataModel: PaginateModel<InventoryControlDataDocument>,
    @InjectModel(InventoryControlData.name)
    private readonly invControlDataModelAgg: AggregatePaginateModel<InventoryControlDataDocument>,
    @InjectModel(ProductionEventNew.name)
    private readonly productionEventNewModel: Model<ProductionEventNewDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    private readonly recipeService: RecipeService,
    @InjectModel(CostOfSalesDetail.name)
    private readonly costofSalesDetailModelAgg: AggregatePaginateModel<CostOfSalesDetailDocument>,
    @InjectModel(CostOfSalesDetail.name)
    private readonly costofSalesDetailModelPag: PaginateModel<CostOfSalesDetailDocument>,
  ) { }

  async create(req: any, dto: CreateInventoryDto): Promise<InventoryDocument> {
    const material = await this.materialModel.findById(dto.materialId);

    if (!material) {
      throw new NotFoundException('error.NOT_FOUND');
    }
    let inventory: InventoryDocument = await this.inventoryModel.create({
      ...dto,
      stockValue: 0,
      stock: 0,
      averageCost: 0,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      uomBase: material.uomBase,
      uomInventory: material.uomInventory,
    });
    inventory.materialId = material;

    return inventory;
  }

  async findAll(
    req: any,
    query: QueryInventoryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryDocument>> {
    let queryToApply: any = {};

    let restaurantIdsSet: Set<mongoose.Types.ObjectId> = new Set();
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    //change the logic
    if (req.query.restaurantIds) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        getAllRest.restaurantId.forEach(id => {
          restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
        });
        req.query.restaurantIds.split(',').forEach(id => {
          restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
        });
        // queryToApply.$or = [
        //   { restaurantId: { $in: getAllRest?.restaurantId.map(id => new mongoose.Types.ObjectId(id)) } },
        //   { restaurantId: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
        // ];
      } else {       
        // queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
        req.query.restaurantIds.split(',').forEach(id => {
          restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
        });
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {       
        // queryToApply.$or = [
        //   { restaurantId: { $in: getAllRest?.restaurantId } },
        // ];
        getAllRest.restaurantId.forEach(id => {
          restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
        });
      }
    }
    if (req.query.materialIds) {
      queryToApply['materialId'] = {
        $in: req.query.materialIds.split(',')
      };
    }
  
    let restaurantIds: mongoose.Types.ObjectId[] = Array.from(restaurantIdsSet);  

    const inventories = await this.inventoryModelPag.paginate(
      {
        ...queryToApply,
        restaurantId: { $in: restaurantIds },
        supplierId: req.user.supplierId,
        $or: [
          { 'materialId.deletedAt': null },
          { 'materialId.deletedAt': { $exists: false } }
        ]
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
              category: 1,
              uomBase: 1
            },
            populate: {
              path: 'uomBase',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            }
          },
          {
            path: 'uomInventory',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uomBase',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
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
      }
    );

    const response = [];
    for (const i in inventories.docs) {
      const docObject: any = inventories.docs[i];
      docObject.convertedUomInventory = [];
      const uomBase = docObject.uomBase;

      for (const j in docObject.uomInventory) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            uomBase,
            docObject.uomInventory[j],
          );

        docObject.convertedUomInventory[j] = {
          uom: convert.targetUom,
          stock: docObject.stock * convert.conversionFactor,
          averageCost: docObject.averageCost / convert.conversionFactor,
          stockValue: docObject.stockValue,
        };
        docObject.uomBase = convert.sourceUom;
      }
      response.push(docObject);
    }
    inventories.docs = response;
    return inventories;
  }

  async fetchHistory(
    req: any,
    query: QueryInventoryHistoryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryHistoryDocument>> {
    // let queryToApply: any = {};
    // const timezone = TIMEZONE;
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }

    let queryToApply: any = {};
    let restData: any = {};
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
        restData.$or = [
          { _id: { $in: getAllRest?.restaurantId } },
          { _id: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
        ];
      } else {
        queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
        restData._id = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: { $in: getAllRest?.restaurantId } },
        ];
        restData.$or = [
          { _id: { $in: getAllRest?.restaurantId } },
        ];
      }
    }
    if (req.query.materialIds) {
      const materialIds = req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['materialId'] = {
        $in: materialIds
      };
    }
    if (req.query.actions) {
      const actionIds = req.query.actions.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['action'] = {
        $in: actionIds
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



    const records = await this.inventoryHistoryModelPag.paginate(
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
            path: 'uomBase',
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
        ],
      },
    );

    return records;
  }

  async fetchLowInventory(
    req: any,
    query: QueryInventoryHistoryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<LowInventoryDocument>> {
    let queryToApply: any = query;
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    const records = await this.lowInventoryModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );

    return records;
  }

  async transferInventoryNew(req, dto: TransferInventoryNewDto, i18n: I18nContext) {

    const invCount = await this.inventoryModel.count({
      materialId: {
        $in: dto.items.map((i) => {
          return i.materialId;
        }),
      },
      restaurantId: dto.sourceRestaurantId,
      supplierId: req.user.supplierId,
    }).populate([{ path: 'materialId' }]);
    if (invCount != dto.items.length) {
      throw new BadRequestException(i18n.t(`SOME_ITEMS_NOT_FOUND`));
    }

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.inventoryTransferNewModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('ST-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'ST-' + postFix + String(counter).padStart(5, '0');

    const inventoryTransfer = await this.inventoryTransferNewModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      docNumber: _docNumber,
    });

    if (inventoryTransfer) {

      await this.inventoryHelperService.applyTransferRequestNew(
        req,
        inventoryTransfer,
      );
    }
    await inventoryTransfer.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (inventoryTransfer.supplierId.autoTransferStockTransferGl) {
      await this.glVoucherHelperService.handleStockTransferNew(inventoryTransfer);
    }

    // Update Inventory Control report
    for (let i = 0; i < inventoryTransfer.items.length; i++) {
      const el = inventoryTransfer.items[i];
      //outbound
      await this.inventoryHelperService.saveInventoryControl(req,
        {
          restaurantId: dto.sourceRestaurantId,
          materialId: el.materialId,
          stockTransferOutQty: el.stock,
          stockTransferOutValue: el.value
        });

      //In bound
      await this.inventoryHelperService.saveInventoryControl(req,
        {
          restaurantId: dto.targetRestaurantId,
          materialId: el.materialId,
          stockTransferInQty: el.stock,
          stockTransferInValue: el.value
        });
    }

    return inventoryTransfer;

  }

  async transferInventoryFindOne(inventoryTransferId: string,
    i18n: I18nContext,) {
    const exists = await this.inventoryTransferNewModel.findById(inventoryTransferId).populate(
      [
        {
          path: 'sourceRestaurantId',
          select: {
            name: 1,
            nameAr: 1,
            _id: 1,
          },
        },
        {
          path: 'targetRestaurantId',
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
    );

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async transferInventoryOld(req, dto: TransferInventoryDto, i18n: I18nContext) {
    const inventory = await this.inventoryModel
      .findOne({
        restaurantId: dto.sourceRestaurantId,
        materialId: dto.materialId,
      })
      .populate([{ path: 'materialId' }]);
    if (!inventory) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    const convert = await this.unitOfMeasureHelperService.getConversionFactor(
      inventory.uomBase,
      dto.uom,
    );
    if (convert.conversionFactor * inventory.stock < dto.stock) {
      throw new NotFoundException(`Not enough stock to transfer`);
    }
    const totalTargetStock = dto.target.reduce((acc, d) => {
      return acc + d.stock;
    }, 0);
    if (dto.stock != totalTargetStock) {
      throw new NotFoundException(`Total target stock must be ${dto.stock}`);
    }

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.inventoryTransferModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('ST-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'ST-' + postFix + String(counter).padStart(5, '0');

    const inventoryTransfer = await this.inventoryTransferModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      docNumber: _docNumber,
    });
    if (inventoryTransfer) {
      await this.inventoryHelperService.applyTransferRequest(
        req,
        inventory,
        inventoryTransfer,
      );
    }
    await inventoryTransfer.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (inventoryTransfer.supplierId.autoTransferStockTransferGl) {
      this.glVoucherHelperService.handleStockTransfer(inventoryTransfer);
    }
    return inventoryTransfer;
  }

  async fetchTransfers(
    req: any,
    query: QueryInventoryHistoryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryTransferNewDocument>> {
    let queryToApply: any = {};
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
    if (req.query.materialIds) {
      queryToApply['items.materialId'] = {
        $in: req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }

    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
      if (req.query.restaurantIds) {
        queryToApply.$or = [
          { sourceRestaurantId: { $in: getAllRest?.restaurantId } },
          { targetRestaurantId: { $in: getAllRest?.restaurantId } },
          { sourceRestaurantId: { $in: req.query.restaurantIds } },
          { targetRestaurantId: { $in: req.query.restaurantIds } }
        ]
      } else {
        queryToApply.$or = [
          { sourceRestaurantId: { $in: getAllRest?.restaurantId } },
          { targetRestaurantId: { $in: getAllRest?.restaurantId } },
        ]
      }
    }
    else if (req.query.restaurantIds) {
      queryToApply.$or = [
        { sourceRestaurantId: { $in: req.query.restaurantIds } },
        { targetRestaurantId: { $in: req.query.restaurantIds } },
      ]
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
    const records = await this.inventoryTransferNewModelPag.paginate(
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
            path: 'sourceRestaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'targetRestaurantId',
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

  async findOne(
    inventoryId: string,
    i18n: I18nContext,
  ): Promise<InventoryDocument> {
    const exists = await this.inventoryModel.findById(inventoryId).populate([
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
        path: 'uomInventory',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
    ]);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    const response: any = exists.toObject();
    response.convertedUomInventory = [];
    for (const i in exists.uomInventory) {
      const convert = await this.unitOfMeasureHelperService.getConversionFactor(
        exists.uomBase,
        exists.uomInventory[i],
      );
      console.log(convert);
      response.convertedUomInventory[i] = {
        uom: convert.targetUom,
        stock: exists.stock * convert.conversionFactor,
        averageCost: exists.averageCost / convert.conversionFactor,
        stockValue: exists.stockValue,
      };
      response.uomBase = convert.sourceUom;
    }

    return response;
  }

  async update(
    identifier: UpdateInventoryIdentifierDto,
    dto: UpdateInventoryDto,
    i18n: I18nContext,
  ): Promise<InventoryDocument> {
    let inventory: InventoryDocument = await this.inventoryModel
      .findOne({
        ...identifier,
      })
      .populate([{ path: 'materialId' },
      {
        path: 'supplierId',
      }]);

    let lastAvgValue = inventory?.averageCost

    if (!inventory) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    const calculatedInventory =
      await this.inventoryHelperService.calculateInventoryItem(
        inventory,
        {
          stock: dto.stock ?? null,
          cost: dto.averageCost ?? null,
          uom: dto.uom ? dto.uom : inventory?.materialId?.uomBase?.toString(),
        },
        InventoryAction.ManualCount,
      );

    inventory = await this.inventoryHelperService.saveInventory(
      inventory,
      calculatedInventory,
      InventoryAction.PriceChange,
      null,
    );

    if (inventory) {
      this.inventoryHelperService.applyToMenuItem(inventory);

      if (inventory.supplierId.autoTransferPriceChange && dto.stock > 0) {
        //Handle price change added here
        this.glVoucherHelperService.handlePriceChange(inventory, lastAvgValue, dto.averageCost);
      }
    }


    return inventory;
  }

  async remove(inventoryId: string, i18n: I18nContext): Promise<boolean> {
    const inventory = await this.inventoryModel.findByIdAndDelete(inventoryId);

    if (!inventory) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async itemConsumptionReport(req, dto: ItemConsumptionDto): Promise<any> {


    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };

    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);

      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(59);

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    if (dto.materialIds && dto.materialIds.length > 0) {
      queryToApply['items.materialId'] = {
        $in: dto.materialIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    }
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      queryToApply.menuItemId = {
        $in: dto.menuItemIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    }

    const itemConsumptionSummary = await this.itemConsumptionModel.find({
      supplierId: req.user.supplierId,
      ...queryToApply,
    })
      .populate({
        path: 'items.materialId',
        select: '_id name nameAr'
      })
      .populate({
        path: 'menuItemId',
        select: '_id name nameAr'
      });




    // Step 1: Group by menuItemId
    const groupedData = itemConsumptionSummary.reduce((acc, item) => {
      const { menuItemId, quantitySold, items } = item;

      if (!acc[menuItemId._id]) {
        acc[menuItemId._id] = {
          menuItemId,
          quantitySold: 0,
          items: []
        };
      }

      acc[menuItemId._id].quantitySold += quantitySold;

      // Merging items array
      items.forEach((newItem) => {
        const existingItem = acc[menuItemId._id].items.find((i) => i.materialId._id === newItem.materialId._id);
        if (existingItem) {
          existingItem.stock += newItem.stock;
          existingItem.cost += newItem.cost;
          existingItem.averageCost += newItem.averageCost;
        } else {
          acc[menuItemId._id].items.push(newItem);
        }
      });

      return acc;
    }, {});

    // Step 2: Convert grouped data object to array
    const resultArray = Object.values(groupedData);

    return resultArray;
  }

  async inventoryReqCreate(req, dto: TransferInventoryRequestDto) {

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.inventoryTransferReqModel.findOne(
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
    if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != null && _lastDocNo.docNumber != '') {
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('TR-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'TR-' + postFix + String(counter).padStart(5, '0');

    let inventoryReq: InventoryTransferRequestDocument = await this.inventoryTransferReqModel.create({
      ...dto,
      requestStatus: TransferRequestStatus.New,
      statusUpdatedDate: new Date(),
      statusUpdatedBy: req.user.userId,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      docNumber: _docNumber,
      history: [{
        requestStatus: TransferRequestStatus.New,
        statusUpdatedDate: new Date(),
        statusUpdatedBy: req.user.userId,
      }]
    });

    return inventoryReq;
  }

  async findAllInventoryRequest(
    req: any,
    query: QueryInventoryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryTransferRequestDocument>> {
    let queryToApply: any = {};
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
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
    if (req.query && req.query.status && req.query.status !== '') {
      queryToApply.requestStatus = req.query.status;
    }
    if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
      if (req.query.restaurantIds) {
        queryToApply.$or = [
          { sourceRestaurantId: { $in: getAllRest?.restaurantId } },
          { targetRestaurantId: { $in: getAllRest?.restaurantId } },
          { sourceRestaurantId: { $in: req.query.restaurantIds } },
          { targetRestaurantId: { $in: req.query.restaurantIds } }
        ]
      } else {
        queryToApply.$or = [
          { sourceRestaurantId: { $in: getAllRest?.restaurantId } },
          { targetRestaurantId: { $in: getAllRest?.restaurantId } },
        ]
      }
    }
    else if (req.query.restaurantIds) {
      queryToApply.$or = [
        { sourceRestaurantId: { $in: req.query.restaurantIds } },
        { targetRestaurantId: { $in: req.query.restaurantIds } },
      ]
    }

    if (req.query.materialId) {
      queryToApply['items.materialId'] = {
        $in: req.query.materialId.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }
    const inventories = await this.inventoryTransferReqModelPag.paginate(
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
            path: 'sourceRestaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'targetRestaurantId',
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
          {
            path: 'statusUpdatedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
          {
            path: 'history.statusUpdatedBy',
            select: {
              name: 1,
              _id: 1,
            },
          }
        ]
      },
    );

    return inventories;
  }

  async findByInvReqId(req, inventoryReqId: string, i18n: I18nContext) {

    const invReqData = await this.inventoryTransferReqModel.findById(inventoryReqId).populate([
      {
        path: 'sourceRestaurantId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'targetRestaurantId',
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
      {
        path: 'statusUpdatedBy',
        select: {
          name: 1,
          _id: 1,
        },
      },
      {
        path: 'history.statusUpdatedBy',
        select: {
          name: 1,
          _id: 1,
        },
      }
    ]);
    if (!invReqData) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return invReqData;
  }

  async inventoryReqUpdate(req, inventoryReqId: string, dto: UpdateTransferInventoryReqDto,
    i18n: I18nContext): Promise<any> {

    const invReqUpdate = await this.inventoryTransferReqModel.findByIdAndUpdate(
      inventoryReqId,
      dto,
      {
        new: true,
      },
    );

    if (!invReqUpdate) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return invReqUpdate;
  }

  async changeInventoryRequestStatus(
    req: any,
    inventoryReqId: string,
    status: TransferRequestStatus,
    i18n: I18nContext,
  ): Promise<InventoryTransferRequestDocument> {
    const inventoryTransferReq = await this.inventoryTransferReqModel.findById(
      inventoryReqId,
    );

    if (!inventoryTransferReq) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    if (
      status == TransferRequestStatus.New
    ) {
      throw new NotFoundException(i18n.t('error.CHANGES_NOT_ALLOWED'));
    }

    if (status == TransferRequestStatus.Sent) {
      const transferDto: TransferInventoryNewDto = {
        date: inventoryTransferReq.date,
        sourceRestaurantId: inventoryTransferReq.sourceRestaurantId?.toString(),
        targetRestaurantId: inventoryTransferReq.targetRestaurantId?.toString(),
        items: inventoryTransferReq.items.map((data) => {
          return {
            materialId: data.materialId?.toString(),
            stock: data.stock,
            uom: data.uom?.toString()
          };
        })
      }
      await this.transferInventoryNew(req, transferDto, i18n);
    }
    const timezone = TIMEZONE;
    let _currentDate = new Date();
    _currentDate = new Date(_currentDate.toLocaleString('en', { timeZone: timezone }));

    inventoryTransferReq.statusUpdatedBy = req.user.userId;
    inventoryTransferReq.statusUpdatedDate = _currentDate;
    inventoryTransferReq.requestStatus = status;
    inventoryTransferReq.history = [
      ...inventoryTransferReq.history,
      {
        requestStatus: status,
        statusUpdatedDate: new Date(),
        statusUpdatedBy: req.user.userId,
      }]
    await inventoryTransferReq.save();

    return inventoryTransferReq;
  }

  async createSTNewScript() {

    const allST: any = await this.inventoryTransferModel.find({});

    let dto = [];
    for (let i = 0; i < allST.length; i++) {
      const el = allST[i];
      const stDTO = {
        supplierId: el.supplierId,
        sourceRestaurantId: el.sourceRestaurantId,
        targetRestaurantId: el.target[0].targetRestaurantId,
        date: el.date,
        trasferredToGl: el.trasferredToGl,
        transferredAt: el.transferredAt,
        glVoucherId: el.glVoucherId,
        addedBy: el.addedBy,
        docNumber: el.docNumber,
        createdAt: el.createdAt,
        items: [{ materialId: el.materialId, uom: el.uom, stock: el.stock }]
      }
      dto.push(stDTO);
    }
    await this.inventoryTransferNewModel.insertMany(dto);

    return true;
  }

  async getInvCountValue(dto: CreateInventoryCountValueDto, i18n: I18nContext) {


    let stockValue = 0;
    const inventory = await this.inventoryModel
      .findOne({
        restaurantId: dto.restaurantId,
        materialId: dto.materialId,
      })
      .populate([{ path: 'materialId' }]);
    if (!inventory) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    const convert =
      await this.unitOfMeasureHelperService.getConversionFactor(
        inventory?.materialId?.uomBase?.toString(),
        dto.uom?.toString()
      );

    stockValue = inventory.averageCost * convert.conversionFactor *
      dto.quantity;

    const matAdd = await this.restaurantMaterialModel.findOne({
      restaurantId: dto.restaurantId,
      materialId: inventory?.materialId?._id
    }).populate([{
      path: 'materialId'
    }]);
    if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
      const convert =
        await this.unitOfMeasureHelperService.getConversionFactor(
          matAdd?.materialId?.uomBase?.toString(),
          dto.uom?.toString()
        );

      stockValue = matAdd?.overridePrice * convert.conversionFactor *
        dto.quantity;
    }

    return { stockValue: stockValue };

  }

  async stockBalanceReport(req: any, paginateOptions: PaginationDto) {

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
      const materialIds = req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['materialId'] = {
        $in: materialIds
      };
    }
    if (req.query.minStockValue > 0 || req.query.maxStockValue > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minStockValue > 0) {
        amountRangeQuery.$gte = Number(req.query.minStockValue);
      }
      if (req.query.maxStockValue > 0) {
        amountRangeQuery.$lte = Number(req.query.maxStockValue);
      }
      queryToApply.stockValue = amountRangeQuery;
    }

    console.log("queryToApply", queryToApply);


    const inventories: any = await this.inventoryModelPagAgg.aggregatePaginate(
      this.inventoryModelPag.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            ...queryToApply
          },
        },
        {
          $lookup: {
            from: 'materials', // Assuming 'materials' is the correct collection name
            localField: 'materialId',
            foreignField: '_id',
            as: 'materialId'
          }
        },
        { $unwind: '$materialId' }, // Flatten the materialDoc array
        {
          $match: {
            $or: [
              { "materialId.deletedAt": { $exists: false } },
              { "materialId.deletedAt": null }
            ]
          }
        },
        {
          $lookup: {
            from: "restaurants", // Assuming the collection name is "materials"
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurantDetails",
          },
        },
        // Unwind materialDetails array (as there might be multiple materials for each grouping)
        {
          $unwind: {
            "path": "$restaurantDetails",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "materialId.uomBase",
            foreignField: "_id",
            as: "uomBase"
          }
        },
        {
          $unwind: "$uomBase" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "materialId.uomBuy",
            foreignField: "_id",
            as: "uomBuy"
          }
        },
        {
          $unwind: {
            "path": "$uomBuy",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $addFields: {
            "materialId.lowercaseName": { $toLower: "$materialId.name" },
            "materialId.lowercaseNameAr": { $toLower: "$materialId.nameAr" },
            "uomBase.lowercaseName": { $toLower: "$uomBase.name" },
            "uomBase.lowercaseNameAr": { $toLower: "$uomBase.nameAr" }
          }
        },
      ]),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy.replace('materialId.name', 'materialId.lowercaseName')
              .replace('materialId.nameAr', 'materialId.lowercaseNameAr')
              .replace('uomBase.name', 'uomBase.lowercaseName')
              .replace('uomBase.nameAr', 'uomBase.lowercaseNameAr')
            ]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
          }
          : DefaultSort,
        ...paginateOptions,
        ...pagination,
      },
    )

    const response = [];

    for (const i in inventories.docs) {
      const docObject: any = inventories.docs[i];
      docObject.purchaseUoM = {};
      const uomBase = docObject?.uomBase?._id;
      let convert: any = {};
      let conversationfactor: 1;
      let q1 = docObject?.stock;
      let u1 = docObject?.uomBase;
      let q2 = null;
      let u2 = null;

      if (docObject?.uomBuy && docObject?.uomBuy?._id
        && uomBase?.toString() !=
        docObject?.uomBuy?._id?.toString()) {

        convert = await this.unitOfMeasureHelperService.getConversionFactor(
          uomBase,
          docObject?.uomBuy?._id,
        );
        if (convert) {
          conversationfactor = convert.conversionFactor;
        }
        q1 = docObject?.stock / docObject?.uomBuy?.baseConversionRate;
        const q2Amount = q1 - parseInt(q1);
        u1 = docObject?.uomBuy;

        q2 = q2Amount * docObject?.uomBuy?.baseConversionRate;
        u2 = docObject?.uomBase;
      }

      const obj = {
        ...docObject,
        q1,
        u1,
        q2,
        u2
      }
      response.push(obj);
    }
    inventories.docs = response;
    return inventories;

  }

  async inventoryRestaurantReport(req: any, paginateOptions: PaginationDto) {

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
      const materialIds = req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['materialId'] = {
        $in: materialIds
      };
    }
    if (req.query.minCurrentStock || req.query.maxCurrentStock) {
      const amountRangeQuery: any = {};

      if (req.query.minCurrentStock) {
        amountRangeQuery.$gte = Number(req.query.minCurrentStock);
      }
      if (req.query.maxCurrentStock) {
        amountRangeQuery.$lte = Number(req.query.maxCurrentStock);
      }
      queryToApply.stock = amountRangeQuery;
    }

    const inventories: any = await this.inventoryModelPagAgg.aggregatePaginate(
      this.inventoryModelPag.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            ...queryToApply
          },
        },
        {
          $lookup: {
            from: 'materials', // Assuming 'materials' is the correct collection name
            localField: 'materialId',
            foreignField: '_id',
            as: 'materialId'
          }
        },
        { $unwind: '$materialId' }, // Flatten the materialDoc array
        {
          $match: {
            $or: [
              { "materialId.deletedAt": { $exists: false } },
              { "materialId.deletedAt": null }
            ]
          }
        },
        {
          $lookup: {
            from: "restaurants", // Assuming the collection name is "materials"
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurantDetails",
          },
        },
        // Unwind materialDetails array (as there might be multiple materials for each grouping)
        {
          $unwind: {
            path: "$restaurantDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "materialId.uomBase",
            foreignField: "_id",
            as: "uomBase"
          }
        },
        {
          $unwind: "$uomBase" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "materialId.uomBuy",
            foreignField: "_id",
            as: "uomBuy"
          }
        },
        {
          $unwind: {
            path: "$uomBuy",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            "materialId.lowercaseName": { $toLower: "$materialId.name" },
            "materialId.lowercaseNameAr": { $toLower: "$materialId.nameAr" },
            "uomBase.lowercaseName": { $toLower: "$uomBase.name" },
            "uomBase.lowercaseNameAr": { $toLower: "$uomBase.nameAr" }
          }
        },
        {
          $lookup: {
            from: "restaurantmaterials", // Assuming the collection name is "restaurantMaterialModel"
            let: { materialId: "$materialId._id", restaurantId: "$restaurantId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$materialId", "$$materialId"] },
                      { $eq: ["$restaurantId", "$$restaurantId"] }
                    ]
                  }
                }
              },
              { $limit: 1 }
            ],
            as: "restaurantMaterial"
          }
        },
        {
          $unwind: {
            path: "$restaurantMaterial",
            preserveNullAndEmptyArrays: true // Preserve inventory documents even if there's no match in restaurantMaterialModel
          }
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "restaurantMaterial.maxLevelUoM",
            foreignField: "_id",
            as: "maxLevelUoM"
          }
        },
      ]),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy.replace('materialId.name', 'materialId.lowercaseName')
              .replace('materialId.nameAr', 'materialId.lowercaseNameAr')
              .replace('uomBase.name', 'uomBase.lowercaseName')
              .replace('uomBase.nameAr', 'uomBase.lowercaseNameAr')
            ]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
          }
          : DefaultSort,
        ...paginateOptions,
        ...pagination,
      });

    return inventories;

  }

  async zeroBalanceReport(req: any, paginateOptions: PaginationDto) {
    let queryToApply: any = {};
    let getAllRest: any = [];

    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }
    // if (req.query.restaurantIds) {
    //   if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
    //     queryToApply.$or = [
    //       { restaurantId: { $in: getAllRest?.restaurantId } },
    //       { restaurantId: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
    //     ];
    //   } else {
    //     queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
    //   }
    // } else {
    //   if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
    //     queryToApply.$or = [
    //       { restaurantId: { $in: getAllRest?.restaurantId } },
    //     ];
    //   }
   // }

   let restaurantIdsSet: Set<mongoose.Types.ObjectId> = new Set();
   if (req.query.restaurantIds) {
        if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
          getAllRest.restaurantId.forEach(id => {
            restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
          });
          req.query.restaurantIds.split(',').forEach(id => {
            restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
          });         
        } else {       
         
          req.query.restaurantIds.split(',').forEach(id => {
            restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
          });
        }
      } else {
        if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {       
         
          getAllRest.restaurantId.forEach(id => {
            restaurantIdsSet.add(new mongoose.Types.ObjectId(id));
          });
        }
      }
  
   let restaurantIds: mongoose.Types.ObjectId[] = Array.from(restaurantIdsSet);  
  
  
    if (req.query.materialIds) {
      const materialIds = req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['materialId'] = {
        $in: materialIds
      };
    }
    if (req.query.minStockValue || req.query.maxStockValue) {
      const amountRangeQuery: any = {};

      if (req.query.minStockValue) {
        amountRangeQuery.$gte = Number(req.query.minStockValue);
      }
      if (req.query.maxStockValue) {
        amountRangeQuery.$lte = Number(req.query.maxStockValue);
      }
      queryToApply.stock = amountRangeQuery;
    }



    const inventories: any = await this.inventoryModelPagAgg.aggregatePaginate(
      this.inventoryModelPag.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            ...queryToApply,
            restaurantId: { $in: restaurantIds },
            $or: [
              { stock: { $lte: 0 } },
              { stockValue: { $lte: 0 } }
            ],
          },
        },
        {
          $lookup: {
            from: 'materials', // Assuming 'materials' is the correct collection name
            localField: 'materialId',
            foreignField: '_id',
            as: 'materialId'
          }
        },
        { $unwind: '$materialId' }, // Flatten the materialDoc array
        {
          $match: {
            $or: [
              { "materialId.deletedAt": { $exists: false } },
              { "materialId.deletedAt": null }
            ]
          }
        },
        {
          $lookup: {
            from: "restaurants", // Assuming the collection name is "materials"
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurantDetails",
          },
        },
        // Unwind materialDetails array (as there might be multiple materials for each grouping)
        {
          $unwind: {
            path: "$restaurantDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "materialId.uomBase",
            foreignField: "_id",
            as: "uomBase"
          }
        },
        {
          $unwind: "$uomBase" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "materialId.uomBuy",
            foreignField: "_id",
            as: "uomBuy"
          }
        },
        {
          $unwind: {
            path: "$uomBuy",
            preserveNullAndEmptyArrays: true // Preserve inventory documents even if there's no match in restaurantMaterialModel
          }
        },
        {
          $addFields: {
            "materialId.lowercaseName": { $toLower: "$materialId.name" },
            "materialId.lowercaseNameAr": { $toLower: "$materialId.nameAr" },
            "uomBase.lowercaseName": { $toLower: "$uomBase.name" },
            "uomBase.lowercaseNameAr": { $toLower: "$uomBase.nameAr" }
          }
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "restaurantMaterial.maxLevelUoM",
            foreignField: "_id",
            as: "maxLevelUoM"
          }
        },

        {
          $lookup: {
            from: "inventorytransfernews",
            let: { materialId: "$materialId._id", restaurantId: "$restaurantId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $type: "$items" }, "array"] }, // Check if items is an array
                      { $in: ["$$materialId", "$items.materialId"] }, // Check if materialId is in items array
                      {
                        $or: [
                          { $eq: [{ $toString: "$sourceRestaurantId" }, { $toString: "$$restaurantId" }] },
                          { $eq: [{ $toString: "$targetRestaurantId" }, { $toString: "$$restaurantId" }] }
                        ]
                      }
                    ]
                  }
                }
              },
              { $sort: { _id: -1 } }, // Sort by _id in descending order to get the latest transfer
              { $limit: 1 } // Limit to only one document, which will be the latest transfer
            ],
            as: "inventorytransfer"
          }
        },
        {
          $unwind: {
            path: "$inventorytransfer",
            preserveNullAndEmptyArrays: true // Preserve inventory documents even if there's no match in restaurantMaterialModel
          }
        },

        {
          $lookup: {
            from: "invoicereceipts",
            let: { materialId: "$materialId._id", restaurantId: "$restaurantId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $type: "$items" }, "array"] }, // Check if items is an array
                      { $in: ["$$materialId", "$items.materialId"] }, // Check if materialId is in items array
                      { $eq: [{ $toString: "$restaurantId" }, { $toString: "$$restaurantId" }] }
                    ]
                  }
                }
              },
              { $sort: { _id: -1 } }, // Sort by _id in descending order to get the latest purchase
              { $limit: 1 } // Limit to only one document, which will be the latest purchase
            ],
            as: "lastPurchase"
          }
        },
        {
          $unwind: {
            path: "$lastPurchase",
            preserveNullAndEmptyArrays: true // Preserve inventory documents even if there's no match in restaurantMaterialModel
          }
        },
        {
          $lookup: {
            from: "productioneventnews",
            let: { materialId: "$materialId._id", restaurantId: "$restaurantId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $type: "$items" }, "array"] }, // Check if items is an array
                      { $in: ["$$materialId", "$items.materialId"] }, // Check if materialId is in items array
                      { $eq: [{ $toString: "$restaurantId" }, { $toString: "$$restaurantId" }] }
                    ]
                  }
                }
              },
              { $sort: { _id: -1 } }, // Sort by _id in descending order to get the latest production event
              { $limit: 1 } // Limit to only one document, which will be the latest production event
            ],
            as: "lastProduction"
          }
        },
        {
          $unwind: {
            path: "$lastProduction",
            preserveNullAndEmptyArrays: true // Preserve inventory documents even if there's no match in restaurantMaterialModel
          }
        },

      ]),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy.replace('materialId.name', 'materialId.lowercaseName')
              .replace('materialId.nameAr', 'materialId.lowercaseNameAr')
              .replace('uomBase.name', 'uomBase.lowercaseName')
              .replace('uomBase.nameAr', 'uomBase.lowercaseNameAr')
            ]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
          }
          : DefaultSort,
        ...paginateOptions,
        ...pagination,
      });

    return inventories;
  }

  async costofFinishedProduct(req: any, paginateOptions: PaginationDto) {

    console.log("paginateOptions", paginateOptions);
    let queryToApply: any = {};
    let restData: any = {};
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
        restData.$or = [
          { _id: { $in: getAllRest?.restaurantId } },
          { _id: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
        ];
      } else {
        queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
        restData._id = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: { $in: getAllRest?.restaurantId } },
        ];
        restData.$or = [
          { _id: { $in: getAllRest?.restaurantId } },
        ];
      }
    }
    if (req.query.materialIds) {
      const materialIds = req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['materialId'] = {
        $in: materialIds
      };
    }
    let startDate = new Date();
    let endDate = new Date();

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    let dynamicFilterForTotalPurchase: any = {};
    if (req.query.minMaterialCost > 0 || req.query.maxMaterialCost > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minMaterialCost > 0) {
        amountRangeQuery.$gte = Number(req.query.minMaterialCost);
      }
      if (req.query.maxMaterialCost > 0) {
        amountRangeQuery.$lte = Number(req.query.maxMaterialCost);
      }

      dynamicFilterForTotalPurchase.materialCost = amountRangeQuery;
    }
    if (req.query.minSellingPrice > 0 || req.query.maxSellingPrice > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minSellingPrice > 0) {
        amountRangeQuery.$gte = Number(req.query.minSellingPrice);
      }
      if (req.query.maxSellingPrice > 0) {
        amountRangeQuery.$lte = Number(req.query.maxSellingPrice);
      }

      dynamicFilterForTotalPurchase.sellingPrice = amountRangeQuery;
    }

    const response: any = await this.costofSalesDetailModelAgg.aggregatePaginate(
      this.costofSalesDetailModelPag.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            ...queryToApply,
          },
        },
        {
          $lookup: {
            from: 'materials', // Assuming 'materials' is the correct collection name
            localField: 'materialId',
            foreignField: '_id',
            as: 'materialId'
          }
        },
        { $unwind: '$materialId' }, // Flatten the materialDoc array
        {
          $match: {
            $or: [
              { "materialId.deletedAt": { $exists: false } },
              { "materialId.deletedAt": null }
            ]
          }
        },
        {
          $lookup: {
            from: "restaurants", // Assuming the collection name is "materials"
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurantDetails",
          },
        },
        // Unwind restaurrant array (as there might be multiple materials for each grouping)
        {
          $unwind: {
            path: "$restaurantDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            "materialId.lowercaseName": { $toLower: "$materialId.name" },
            "materialId.lowercaseNameAr": { $toLower: "$materialId.nameAr" }
          }
        },
        {
          $group: {
            _id: {
              materialId: "$materialId",
              menuItemId: "$menuItemId"
            },
            totalQuantitySold: { $sum: "$quantitySold" },
            totalSellingPrice: { $sum: "$sellingPrice" },
            totalCost: { $sum: "$cost" },
            restaurantId: { $first: "$restaurantDetails" }
          }
        },
        {
          $project: {
            _id: 0,
            materialId: "$_id.materialId",
            menuItemId: "$_id.menuItemId",
            restaurantId: 1,
            totalQuantitySold: 1,
            totalSellingPrice: 1,
            totalCost: 1,
            sellingPrice: { $divide: ["$totalSellingPrice", "$totalQuantitySold"] },
            materialCost: { $divide: ["$totalCost", "$totalQuantitySold"] },
            costPerc: { $multiply: [{ $divide: ["$totalCost", "$totalSellingPrice"] }, 100] }
          }
        },
        {
          $match: dynamicFilterForTotalPurchase
        },
        {
          $project: {
            materialId: 1,
            menuItemId: 1,
            restaurantId: 1,
            totalQuantitySold: 1,
            totalSellingPrice: 1,
            totalCost: 1,
            sellingPrice: 1,
            materialCost: 1,
            costPerc: 1,
          }
        }
      ],

      ),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy.replace('materialId.name', 'materialId.lowercaseName')
              .replace('materialId.nameAr', 'materialId.lowercaseNameAr')
            ]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
          }
          : DefaultSort,
        ...paginateOptions,
        ...pagination,
      }
    );

    return response;

  }

  async inventoryControlReport(req: any, paginateOptions: QueryInventoryControlDto) {
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
      queryToApply['materialId'] = {
        $in: req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }

    let startDate = new Date();
    let endDate = new Date();

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    console.log("startDate", startDate);
    console.log("endDate", endDate);
    const result: any = await this.invControlDataModelAgg.aggregatePaginate(
      this.invControlDataModel.aggregate([
        // Match documents based on startDate and endDate
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            ...queryToApply,
          },
        },
        {
          $group: {
            _id: {
              materialId: "$materialId"
            },
            restaurantId: { $first: "$restaurantId" },
            totalStockTransferInQty: { $sum: "$stockTransferInQty" },
            totalStockTransferInValue: { $sum: "$stockTransferInValue" },
            totalPurchaseQuantity: { $sum: "$purchaseQuantity" },
            totalPurchaseValue: { $sum: "$purchaseValue" },
            startingStock: {
              $first: {
                $cond: {
                  if: { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }, { $dateToString: { format: "%Y-%m-%d", date: startDate } }] },
                  then: '$startingStock',
                  else: 0 // or any default value you want to set
                }
              }
            },
            startingStockValue: {
              $first: {
                $cond: {
                  if: { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }, { $dateToString: { format: "%Y-%m-%d", date: startDate } }] },
                  then: '$startingStockValue',
                  else: 0 // or any default value you want to set
                }
              }
            },
            stockTransferInQty: { $sum: "$stockTransferInQty" },
            stockTransferInValue: { $sum: "$stockTransferInValue" },
            stockTransferOutQty: { $sum: "$stockTransferOutQty" },
            stockTransferOutValue: { $sum: "$stockTransferOutValue" },
            productionCostQty: { $sum: "$productionCostQty" },
            productionCostValue: { $sum: "$productionCostValue" },
            invCount: { $sum: "$invCount" },
            invCountValue: { $sum: "$invCountValue" },
            totalICQtyGain: { $sum: "$totalICQtyGain" },
            totalICValueGain: { $sum: "$totalICValueGain" },
            totalICQtyLoss: { $sum: "$totalICQtyLoss" },
            totalICValueLoss: { $sum: "$totalICValueLoss" },
            totalICCountGain: { $sum: "$totalICCountGain" },
            totalICCountLoss: { $sum: "$totalICCountLoss" },
            vendorReturnQty: { $sum: "$vendorReturnQty" },
            vendorReturnValue: { $sum: "$vendorReturnValue" },
            productionConsumeQty: { $sum: "$productionConsumeQty" },
            productionConsumeValue: { $sum: "$productionConsumeValue" },
            productionMaterialConsumeQty: { $sum: "$productionMaterialConsumeQty" },
            productionMaterialConsumeValue: { $sum: "$productionMaterialConsumeValue" },
            wasteQty: { $sum: "$wasteQty" },
            wasteValue: { $sum: "$wasteValue" },
            salesConsumeQty: { $sum: "$salesConsumeQty" },
            salesConsumeValue: { $sum: "$salesConsumeValue" },
            // totalInQty: { $sum:  "$totalInQty"}, //ChangedTo => totalICQtyGain(Total Inventory Count Gain - Qnty)+ productionConsumeQty(Production Quantity) +stockTransferInQty(Stock Transfer inbound Quantity) + totalPurchaseQuantity(Purchase Quantity) + startingStock(starting inventory stock)
            // totalInValue: { $sum: "$totalInValue"}, //ChangedTo => totalICValueGain + productionCostValue + stockTransferInValue + totalPurchaseValue
            // totalOutQty: { $sum: "$totalOutQty" }, //ChangedTo =>totalICQtyLoss + wasteQty + salesConsumeQty + qtyProductionWasteEvent + productionConsumeQty + stockTransferOutQty +vendorReturnQty
            // totalOutValue: { $sum: "$totalOutValue" }, //ChangedTo =>totalICValueLoss + wasteValue + salesConsumeValue + amountProductionWasteEvent + productionConsumeValue + stockTransferOutValue + vendorReturnValue
            amountProductionWasteEvent: { $sum: "$amountProductionWasteEvent" },
            qtyProductionWasteEvent: { $sum: "$qtyProductionWasteEvent" },
            calculatedStockQty: { $sum: "$calculatedStockQty" },
            calculatedStockValue: { $sum: "$calculatedStockValue" },
            calculatedStockAvgCost: { $sum: "$calculatedStockAvgCost" },
            stockValueInSystem: {
              $first: {
                $cond: {
                  if: { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }, { $dateToString: { format: "%Y-%m-%d", date: endDate } }] },
                  then: '$stockValueInSystem',
                  else: 0 // or any default value you want to set
                }
              }
            },
            stockQtyInSystem: {
              $first: {
                $cond: {
                  if: { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }, { $dateToString: { format: "%Y-%m-%d", date: endDate } }] },
                  then: '$stockQtyInSystem',
                  else: 0 // or any default value you want to set
                }
              }
            },
            materialDetails: { $first: "$$ROOT" },
          },
        },
        // Lookup to populate material details
        {
          $lookup: {
            from: "materials", // Assuming the collection name is "materials"
            localField: "_id.materialId",
            foreignField: "_id",
            as: "materialDetails.material",
            pipeline: [
              {
                $lookup: {
                  from: 'unitofmeasures',
                  let: { uomBuyId: "$uomBuy" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$_id", "$$uomBuyId"] }
                      }
                    }
                  ],
                  as: "uomBuy"
                },
              },
              {
                $unwind: {
                  path: "$uomBuy", // Specify the path to unwind
                  preserveNullAndEmptyArrays: true // Correctly placed inside the $unwind object
                }
              }
            ],
          },
        },
        // Unwind materialDetails array (as there might be multiple materials for each grouping)
        {
          $unwind: "$materialDetails.material",
        },
        {
          $lookup: {
            from: "restaurants", // Assuming the collection name is "materials"
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurantDetails",
          },
        },
        // Unwind materialDetails array (as there might be multiple materials for each grouping)
        {
          $unwind: "$restaurantDetails",
        },
        // Project to reshape the document and include all fields
        {
          $project: {
            _id: 0,
            materialId: "$_id.materialId",
            restaurantId: 1,
            totalStockTransferInQty: 1,
            totalStockTransferInValue: 1,
            totalPurchaseQuantity: 1,
            totalPurchaseValue: 1,
            startingStock: 1,
            startingStockValue: 1,
            stockTransferInQty: 1,
            stockTransferInValue: 1,
            stockTransferOutQty: 1,
            stockTransferOutValue: 1,
            productionCostQty: 1,
            productionCostValue: 1,
            invCount: 1,
            invCountValue: 1,
            totalICQtyGain: 1,
            totalICValueGain: 1,
            totalICQtyLoss: 1,
            totalICValueLoss: 1,
            totalICCountGain: 1,
            totalICCountLoss: 1,
            vendorReturnQty: 1,
            vendorReturnValue: 1,
            productionConsumeQty: 1,
            productionConsumeValue: 1,
            productionMaterialConsumeQty: 1,
            productionMaterialConsumeValue: 1,
            wasteQty: 1,
            wasteValue: 1,
            salesConsumeQty: 1,
            salesConsumeValue: 1,
            totalInQty: {
              $add: [
                "$totalICQtyGain", // Total Inventory Count Gain - Quantity
                "$productionConsumeQty", // Production Quantity
                "$stockTransferInQty", // Stock Transfer Inbound Quantity
                "$totalPurchaseQuantity", // Purchase Quantity
                "$startingStock" // Starting Inventory Stock
              ]
            },
            totalInValue: {
              $add: [
                "$totalICValueGain", // Total Inventory Count Gain - Value
                "$productionCostValue", // Production Cost Value
                "$stockTransferInValue", // Stock Transfer In Value
                "$totalPurchaseValue", // Purchase Value
                "$startingStockValue" // Starting Stock Value
              ]
            },
            totalOutQty: {
              $add: [
                "$totalICQtyLoss",
                "$wasteQty",
                "$salesConsumeQty",
                "$qtyProductionWasteEvent",
                "$productionConsumeQty",
                "$stockTransferOutQty",
                "$vendorReturnQty"
              ]
            },
            totalOutValue: {
              $add: [
                "$totalICValueLoss",
                "$wasteValue",
                "$salesConsumeValue",
                "$amountProductionWasteEvent",
                "$productionConsumeValue",
                "$stockTransferOutValue",
                "$vendorReturnValue"
              ]
            },
            amountProductionWasteEvent: 1,
            qtyProductionWasteEvent: 1,
            calculatedStockQty: 1,
            calculatedStockValue: 1,
            calculatedStockAvgCost: 1,
            stockValueInSystem: 1,
            stockQtyInSystem: 1,
            materialDetails: "$materialDetails.material",
            restaurantDetails: "$restaurantDetails"
          },
        },
      ]),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy]: paginateOptions.sortDirection
              ? paginateOptions.sortDirection
              : 1,
          }
          : DefaultSortForInvControlReport,
        lean: true,
        ...paginateOptions,
        ...pagination,
      }
    );
    return result;
  }

}
