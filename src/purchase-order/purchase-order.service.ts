import {
  BadRequestException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import { Model, PaginateModel, PaginateResult, LeanDocument } from 'mongoose';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import {
  Restaurant,
  RestaurantDocument,
} from 'src/restaurant/schemas/restaurant.schema';
import { AggregatePaginateModel } from 'mongoose';
import { AggregatePaginateResult } from 'mongoose';
import { QueryPurchaseOrderPreviewDto } from './dto/query-purchase-order-preview.dto';
import mongoose from 'mongoose';
import {
  RestaurantMaterial,
  RestaurantMaterialDocument,
} from 'src/material/schemas/restaurant-material.schema';
import { Vendor, VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { SelectedVendor } from '../selected-vendor/schema/selected-vendor.schema';
import {
  UnitOfMeasure,
  UnitOfMeasureDocument,
} from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { PurchaseOrderStatus } from './enum/en';
import { FillToParDto } from './dto/fill-to-par.dto';
import { PurchaseOrderHelperService } from './purchase-order-helper.service';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { BulkPoCreateDto } from './dto/bulk-po-create.dto';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import { GoodsReceiptService } from 'src/goods-receipt/goods-receipt.service';
import { InvoiceReceiptService } from 'src/invoice-receipt/invoice-receipt.service';
import { ManualVendorPaymentService } from 'src/manual-vendor-payment/manual-vendor-payment.service';
import {
  GlAccountMapping,
  GlAccountMappingDocument,
} from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptDocument,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { Inventory, InventoryDocument } from 'src/inventory/schemas/inventory.schema';
import { MaxCeilingPrice, MaxCeilingPriceDocument } from './schemas/max-ceiling.schema';
import { TaxIndication } from 'src/expense/enum/en';
import { RefInvoiceType } from 'src/manual-customer-payment/enum/en.enum';
import { DocTypes, TransStatus } from 'src/core/Constants/enum';
import { CreateGoodsReceiptDto } from 'src/goods-receipt/dto/create-goods-receipt.dto';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModelPag: PaginateModel<PurchaseOrderDocument>,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: AggregatePaginateModel<RestaurantMaterialDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    @InjectModel(UnitOfMeasure.name)
    private readonly unitOfMeasureModel: Model<UnitOfMeasureDocument>,
    @InjectModel(GoodsReceipt.name)
    private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
    private readonly purchaseOrderHelperService: PurchaseOrderHelperService,
    @Inject(forwardRef(() => GoodsReceiptService))
    private readonly goodsReceiptService: GoodsReceiptService,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,

    private readonly invoiceReceiptService: InvoiceReceiptService,

    private readonly manualVendorPaymentService: ManualVendorPaymentService,
    @InjectModel(GlAccountMapping.name)
    private readonly glAccountMappingModel: Model<GlAccountMappingDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(MaxCeilingPrice.name)
    private readonly maxCeilingPriceModel: Model<MaxCeilingPriceDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(
    req: any,
    dto: CreatePurchaseOrderDto,
    i18n: I18nContext,
  ): Promise<PurchaseOrderDocument> {

    if (!dto.isReturn) {
      //Reference number validation unique by restaurant Id
      if (dto.referenceNumber && dto.referenceNumber != '') {
        const existRef = await this.purchaseOrderModel.find({
          supplierId: req.user.supplierId,
          restaurantId: dto.restaurantId,
          referenceNumber: dto.referenceNumber
        });

        if (existRef && existRef?.length > 0) {
          throw new BadRequestException('Reference number already exists');
        }
      }
      //Max Stock Level number validation unique by restaurant Id
      for (let i = 0; i < dto.items.length; i++) {
        const el = dto.items[i];
        const getMatAddDetail = await this.restaurantMaterialModel.find({
          materialId: el.materialId,
          restaurantId: dto.restaurantId,
        }).populate([{
          path: 'materialId'
        }]);

        if (getMatAddDetail && getMatAddDetail?.length > 0
        ) {
          //need to check available quantity from inventory 

          let existingStock = 0;
          let existingStockPrice = 0;

          const existsItem = await this.inventoryModel.findOne({
            materialId: el.materialId,
            restaurantId: dto.restaurantId,
          });

          if (existsItem) {
            let convertInv = await this.unitOfMeasureHelperService.getConversionFactor(
              existsItem.uomBase,
              el.uom
            );
            existingStock = existsItem.stock * convertInv.conversionFactor;
            existingStockPrice = existsItem.stockValue * convertInv.conversionFactor;
          }

          if (getMatAddDetail[0]['maxStockLevel'] && Number(getMatAddDetail[0]['maxStockLevel']) > 0
            && getMatAddDetail[0]['maxLevelUoM']) {

            let convert = await this.unitOfMeasureHelperService.getConversionFactor(
              getMatAddDetail[0]['maxLevelUoM'],
              el.uom
            );
            if (
              (Number(getMatAddDetail[0]['maxStockLevel']) * convert.conversionFactor) <
              (existingStock) + (el.stock * convert.conversionFactor)) {
              throw new BadRequestException(`Maximum stock level limit exceed`);
            }
          }

          if (getMatAddDetail[0]['maxCeilingPrice'] && Number(getMatAddDetail[0]['maxCeilingPrice']) > 0) {
            let convert = await this.unitOfMeasureHelperService.getConversionFactor(
              getMatAddDetail[0]['materialId']['uomBase'],
              el.uom
            );

            console.log("getMatAddDetail[0]['maxCeilingPrice']", getMatAddDetail[0]['maxCeilingPrice']);
            console.log("existingStockPrice", existingStockPrice);
            console.log("existingStockPrice2", (existingStockPrice) + (el.stock * convert.conversionFactor));

            if (
              (Number(getMatAddDetail[0]['maxCeilingPrice']) * convert.conversionFactor) <
              (existingStockPrice) + (el.stock * convert.conversionFactor)) {
              // Just entry about maxCeiling Price

              const matDto = {
                restaurantId: dto.restaurantId,
                materialId: el.materialId,
                stock: el.stock * convert.conversionFactor,
                uom: el.uom
              }

              await this.maxCeilingPriceModel.create({
                supplierId: req.user.supplierId,
                ...matDto
              });
              console.log("Max Celing Price");
            }
          }
        }
      }

      const material = await this.materialModel.count({
        _id: {
          $in: dto.items.map((i) => {
            return i.materialId;
          }),
        },
        supplierId: req.user.supplierId,
      });
      if (material != dto.items.length) {
        throw new BadRequestException(i18n.t(`SOME_ITEMS_NOT_FOUND`));
      }
    }


    const items: any = dto.items;
    let totalCost = 0;
    items.forEach((i) => {
      const itemTaxableAmount = dto.taxIndication == TaxIndication.Included ?
        (i.cost / (1 + Tax.rate / 100)) : i.cost;
      i.tax = dto.taxIndication == TaxIndication.Included ?
        (itemTaxableAmount * Tax.rate) / 100 : 0;
      i.netPrice = itemTaxableAmount;
      i.stockValue = i.stock * i.cost;
      totalCost += i.stockValue;
    });
    totalCost += dto.additionalCost ?? 0;
    const totalTaxableAmount = dto.taxIndication == TaxIndication.Included ?
      (totalCost / (1 + Tax.rate / 100)) : totalCost;
    const tax = dto.taxIndication == TaxIndication.Included ?
      (totalTaxableAmount * Tax.rate) / 100 : 0;


    let poNumber = 100001;
    const lastPurchaseOrder = await this.purchaseOrderModel.findOne(
      { supplierId: req.user.supplierId },
      {},
      {
        sort: {
          poNumber: -1,
        },
      },
    );
    if (lastPurchaseOrder && lastPurchaseOrder.poNumber) {
      poNumber = lastPurchaseOrder.poNumber + 1;
    }


    let purchaseOrder = await this.purchaseOrderModel.create({
      ...dto,
      items,
      totalCost,
      tax,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      poNumber,
      docType: dto.isReturn ? DocTypes.POReturn : DocTypes.Standard
    });
    this.purchaseOrderHelperService.postPurchaseOrderCreate(purchaseOrder);

    if (dto.isSimplified && dto.transType == TransStatus.Approved) {
      console.log('Goods Receipt Started');
      const grDTO = {
        ...dto,
        transType: dto.transType,
        purchaseOrderId: purchaseOrder._id,
      };
      const grResp = await this.goodsReceiptService.create(req, grDTO, i18n);
      if (grResp) {
        console.log('Invoice Receipt Started');
        purchaseOrder = Object.assign(purchaseOrder, { goodsReceipt: grResp });
        const irResp = await this.invoiceReceiptService.create(
          req,
          grDTO,
          i18n,
        );
        purchaseOrder = Object.assign(purchaseOrder, {
          invoiceReceipt: irResp,
        });
        if (irResp && dto.paymentMethod && dto.paymentMethod != PaymentMethod.Credit) {
          const glAccountId = await this.glAccountMappingModel.findOne({
            supplierId: req.user.supplierId,
          });
          const mvpDTO = {
            amount: totalCost,
            date: dto.date,
            purchaseOrderId: purchaseOrder._id,
            restaurantId: dto.restaurantId,
            vendorId: dto.vendorId,
            items: [],
            invoices: [{ invoiceId: irResp._id, type: RefInvoiceType.InvoiceReceipt }],
            payFrom: dto.paymentMethod,
            text: '',
            isReturn: dto.isReturn,
            transType: dto.transType,
            otherGLAccount: dto.otherGLAccount
          };
          const manualVendorPay = await this.manualVendorPaymentService.createNew(
            req,
            mvpDTO,
            i18n,
          );
          purchaseOrder = Object.assign(purchaseOrder, {
            vendorPay: manualVendorPay,
          });
        }
      }
    }
    return purchaseOrder;
  }

  async bulkPurchaseOrder(
    req: any,
    dto: BulkPoCreateDto,
    i18n: I18nContext,
  ): Promise<PurchaseOrderDocument[]> {
    const posToCreate: CreatePurchaseOrderDto[] = [];
    const response: PurchaseOrderDocument[] = [];
    for (const i in dto.payload) {
      if (dto.payload[i].vendorRecord.poQuantity <= 0) {
        throw new BadRequestException(
          `PoQuantity  for ${dto.payload[i].material._id} must be a non-zero positive value`,
        );
      }
      if (
        !posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
        ]
      ) {
        posToCreate[
          dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
        ] = {
          restaurantId: dto.payload[i].restaurant._id,
          vendorId: dto.payload[i].restaurant._id,
          items: [],
        };
      }
      posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
      ].items.push({
        materialId: dto.payload[i].material._id,
        vendorMaterialId: dto.payload[i].vendorRecord.vendorMaterialId ?? null,
        cost: dto.payload[i].vendorRecord.cost,
        stock: dto.payload[i].vendorRecord.poQuantity,
        uom: dto.payload[i].vendorRecord.uom._id,
      });
    }
    for (const i in posToCreate) {
      const purchaseOrder = await this.create(req, posToCreate[i], i18n);
      response.push(purchaseOrder);
    }
    return response;
  }

  async bulkPurchaseOrderPreview(
    req: any,
    dto: BulkPoCreateDto,
    i18n: I18nContext,
  ): Promise<any> {
    const posToCreate = [];
    let total = 0;
    for (const i in dto.payload) {
      if (dto.payload[i].vendorRecord.poQuantity <= 0) {
        throw new BadRequestException(
          `PoQuantity  for ${dto.payload[i].material._id} must be a non-zero positive value`,
        );
      }
      if (
        !posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
        ]
      ) {
        posToCreate[
          dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
        ] = {
          restaurant: dto.payload[i].restaurant,
          vendor: dto.payload[i].vendor,
          items: [],
          total: 0,
          totalNetPrice: 0,
          totalTax: 0,
        };
      }
      const itemTaxableAmount = roundOffNumber(
        dto.payload[i].vendorRecord.cost / (1 + Tax.rate / 100),
      );

      const netPrice = itemTaxableAmount;
      const stockValue = roundOffNumber(
        dto.payload[i].vendorRecord.cost *
        dto.payload[i].vendorRecord.poQuantity,
      );
      const tax = roundOffNumber(
        dto.payload[i].vendorRecord.cost - itemTaxableAmount,
      );

      posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
      ].items.push({
        material: dto.payload[i].material,
        vendorMaterialId: dto.payload[i].vendorRecord.vendorMaterialId ?? null,
        cost: dto.payload[i].vendorRecord.cost,
        stock: dto.payload[i].vendorRecord.poQuantity,
        uom: dto.payload[i].vendorRecord.uom,
        tax,
        netPrice,
        stockValue,
      });
      posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
      ].total += stockValue;
      posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
      ].totalNetPrice += netPrice * dto.payload[i].vendorRecord.poQuantity;
      posToCreate[
        dto.payload[i].restaurant._id + '_' + dto.payload[i].vendor._id
      ].totalTax += tax * dto.payload[i].vendorRecord.poQuantity;
      total += stockValue;
    }
    const purchaseOrders = [];
    for (const i in posToCreate) {
      posToCreate[i].total = roundOffNumber(posToCreate[i].total);
      posToCreate[i].totalNetPrice = roundOffNumber(
        posToCreate[i].totalNetPrice,
      );
      posToCreate[i].totalTax = roundOffNumber(posToCreate[i].totalTax);
      purchaseOrders.push(posToCreate[i]);
    }

    const totalTaxableAmount = roundOffNumber(total / (1 + Tax.rate / 100));
    const totalTax = roundOffNumber((totalTaxableAmount * Tax.rate) / 100);
    return {
      purchaseOrders,
      total: roundOffNumber(total),
      totalNetPrice: totalTaxableAmount,
      totalTax,
    };
  }

  async createDraft(
    req: any,
    dto: CreatePurchaseOrderDto,
    i18n: I18nContext,
  ): Promise<PurchaseOrderDocument> {
    const items: any = dto.items;
    let totalCost = 0;
    items.forEach((i) => {
      const itemTaxableAmount = roundOffNumber(i.cost / (1 + Tax.rate / 100));
      i.tax = (itemTaxableAmount * Tax.rate) / 100;
      i.netPrice = itemTaxableAmount;
      i.stockValue = i.stock * i.cost;
      totalCost += i.stockValue;
    });
    const totalTaxableAmount = roundOffNumber(totalCost / (1 + Tax.rate / 100));
    const tax = (totalTaxableAmount * Tax.rate) / 100;
    return await this.purchaseOrderModel.findOneAndUpdate(
      {
        restaurantId: dto.restaurantId,
        vendorId: dto.vendorId,
        status: PurchaseOrderStatus.Draft,
      },
      {
        ...dto,
        items,
        totalCost,
        tax,
        addedBy: req.user.userId,
        supplierId: req.user.supplierId,
        status: PurchaseOrderStatus.Draft,
      },
      { upsert: true, setDefaultsOnInsert: true, new: true },
    );
  }

  async fillToPar(req: any, dto: FillToParDto, i18n: I18nContext) {
    const response = [];
    let restaurants = await this.restaurantModel.find(
      {
        _id: { $in: dto.payload.map((d) => d.restaurantId) },
      },
      { name: 1, nameAr: 1, _id: 1 },
    );
    restaurants = restaurants.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    let materials = await this.materialModel
      .find(
        {
          _id: {
            $in: dto.payload.map((d) => d.materialId),
          },
        },
        {
          name: 1,
          nameAr: 1,
          _id: 1,
          description: 1,
          descriptionAr: 1,
          uomBase: 1,
          materialType: 1,
          procurementType: 1,
        },
      )
      .populate([
        {
          path: 'uomBase',
          select: { name: 1, nameAr: 1, _id: 1 },
        },
      ]);
    materials = materials.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    let vendors = await this.supplierModel.find(
      {
        _id: {
          $in: dto.payload.map((d) => {
            return d.vendorId;
          }),
        },
      },
      { name: 1, nameAr: 1 },
    );

    vendors = vendors.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);
    for (const i in dto.payload) {
      const singleDtoObj = dto.payload[i];

      const inventory = await this.restaurantMaterialModel.aggregate(
        [
          {
            $match: {
              materialId: new mongoose.Types.ObjectId(singleDtoObj.materialId),
              restaurantId: new mongoose.Types.ObjectId(
                singleDtoObj.restaurantId,
              ),
              supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            },
          },
          {
            $lookup: {
              from: 'inventories',
              let: {
                restaurantId: '$restaurantId',
                materialId: '$materialId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$restaurantId', '$$restaurantId'],
                    },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ['$materialId', '$$materialId'],
                    },
                  },
                },
              ],
              as: 'inventory',
            },
          },
          {
            $lookup: {
              from: 'selectedvendors',
              let: {
                restaurantId: '$restaurantId',
                materialId: '$materialId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$restaurantId', '$$restaurantId'],
                    },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ['$materialId', '$$materialId'],
                    },
                  },
                },
                {
                  $match: {
                    vendorId: new mongoose.Types.ObjectId(
                      singleDtoObj.vendorId,
                    ),
                  },
                },
              ],
              as: 'selectedVendor',
            },
          },
          {
            $match: {
              selectedVendor: { $ne: [] },
            },
          },
        ],
        { allowDiskUse: true },
      );
      console.log(inventory);

      if (inventory.length == 0) {
        throw new NotFoundException(i18n.t('error.NOT_FOUND'));
      }
      const uom = await this.unitOfMeasureModel.findOne(
        {
          _id: inventory[0].selectedVendor[0]?.uom,
        },
        { name: 1, nameAr: 1, _id: 1 },
      );

      let conversionFactor = 1;
      if (
        inventory[0].selectedVendor[0].uom.toString() !=
        materials[singleDtoObj.materialId].uomBase.toString()
      ) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            inventory[0].selectedVendor[0].uom,
            materials[singleDtoObj.materialId].uomBase,
          );
        conversionFactor = convert.conversionFactor;
      }

      let poQuantityBase =
        inventory[0].parLevel - inventory[0].inventory[0]?.stock;
      if (!poQuantityBase) poQuantityBase = 0;
      let poQuantity = poQuantityBase / conversionFactor;
      if (!poQuantity) poQuantity = 0;
      response.push({
        restaurant: restaurants[singleDtoObj.restaurantId],
        material: materials[singleDtoObj.materialId],
        materialRestaurant: {
          minStockLevel: inventory[0].minStockLevel,
          parLevel: inventory[0].parLevel,
          onHand: inventory[0].inventory[0]?.stock ?? 0,
          poQuantityBase: poQuantityBase < 0 ? 0 : poQuantityBase,
          uomBase: materials[singleDtoObj.materialId].uomBase,
        },
        vendor: vendors[singleDtoObj.vendorId],
        vendorRecord: {
          cost: inventory[0].selectedVendor[0]?.cost,
          quantity: inventory[0].selectedVendor[0]?.quantity,
          uom: uom,
          defaultParQuantity: poQuantity < 0 ? 0 : poQuantity,
          poQuantity: 0,
          vendorMaterialId: inventory[0].selectedVendor[0].vendorMaterialId,
        },
      });
    }
    return response;
  }

  async findAll(
    req: any,
    query: QueryPurchaseOrderDto,
    paginateOptions: PaginationDto,
  ): Promise<any> {
    let queryToApply: any = query;

    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }


    // if (req.query.restaurantIds) {
    //   queryToApply.restaurantId = {
    //     $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
    //   };
    // }
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

    if (req.query.vendorIds) {
      queryToApply.vendorId = {
        $in: req.query.vendorIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
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
    if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minAmount > 0) {
        amountRangeQuery.$gte = Number(req.query.minAmount);
      }
      if (req.query.maxAmount > 0) {
        amountRangeQuery.$lte = Number(req.query.maxAmount);
      }
      queryToApply.totalCost = amountRangeQuery;
    }
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }
    if (req.query && req.query.poNumber && req.query.poNumber != '') {
      const poNumberQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$poNumber" },
            regex: req.query.poNumber,
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

    const aggregateResult = await this.purchaseOrderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: '$totalCost',
          }
        },
      },
    ]);
    const records = await this.purchaseOrderModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
        deletedAt: null,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'vendorId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
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
          {
            path: 'items.materialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'items.vendorMaterialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'items.uom',
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
          {
            path: 'referencePO',
            select: {
              poNumber: 1,
              _id: 1,
            },
          },
        ],

      },
    );

    let response = {
      ...records,
      aggregateResult: aggregateResult[0]
    }

    return response;
  }

  async sheet(
    req: any,
    query: QueryPurchaseOrderPreviewDto,
    paginateOptions: PaginationDto,
  ): Promise<AggregatePaginateResult<RestaurantDocument>> {
    let queryToApply: any = {};
    if (query.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(
        query.restaurantId,
      );
    }
    if (query.materialId) {
      queryToApply.materialId = new mongoose.Types.ObjectId(query.materialId);
    }
    let vendorQuery: any = { vendorId: {}, selectedVendor: {} };
    if (query.vendorId) {
      vendorQuery = {
        vendorId: { vendorId: new mongoose.Types.ObjectId(query.vendorId) },
        selectedVendor: {
          selectedVendor: {
            $ne: [],
          },
        },
      };
    }
    const records = await this.restaurantMaterialModel.aggregatePaginate(
      this.restaurantMaterialModel.aggregate(
        [
          {
            $match: {
              ...queryToApply,
              supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            },
          },
          {
            $lookup: {
              from: 'inventories',
              let: {
                restaurantId: '$restaurantId',
                materialId: '$materialId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$restaurantId', '$$restaurantId'],
                    },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ['$materialId', '$$materialId'],
                    },
                  },
                },
              ],
              as: 'inventory',
            },
          },
          {
            $lookup: {
              from: 'selectedvendors',
              let: {
                restaurantId: '$restaurantId',
                materialId: '$materialId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$restaurantId', '$$restaurantId'],
                    },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ['$materialId', '$$materialId'],
                    },
                  },
                },
                {
                  $match: {
                    isDefault: true,
                    ...vendorQuery.vendorId,
                  },
                },
              ],
              as: 'selectedVendor',
            },
          },
          {
            $match: {
              ...vendorQuery.selectedVendor,
            },
          },
        ],
        { allowDiskUse: true },
      ),
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    const docs = records.docs;
    let restaurants = await this.restaurantModel.find(
      {
        _id: { $in: docs.map((d) => d.restaurantId) },
      },
      { name: 1, nameAr: 1, _id: 1 },
    );
    restaurants = restaurants.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    let materials = await this.materialModel.find(
      {
        _id: {
          $in: docs.map((d) => d.materialId),
        },
      },
      {
        name: 1,
        nameAr: 1,
        _id: 1,
        description: 1,
        descriptionAr: 1,
        uomBase: 1,
        materialType: 1,
        procurementType: 1,
      },
    );
    materials = materials.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    let unitOfMeasures = await this.unitOfMeasureModel.find(
      {
        $or: [
          {
            _id: {
              $in: materials.map((m) => m.uomBase),
            },
          },
          {
            _id: {
              $in: docs.map((d) => d.selectedVendor[0]?.uom),
            },
          },
        ],
      },
      { name: 1, nameAr: 1, _id: 1 },
    );

    unitOfMeasures = unitOfMeasures.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    let vendors = await this.supplierModel.find(
      {
        _id: {
          $in: docs.map((d) => {
            console.log(d.selectedVendor[0]?.vendorId);
            return d.selectedVendor[0]?.vendorId;
          }),
        },
      },
      { name: 1, nameAr: 1 },
    );

    vendors = vendors.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    const response = [];
    for (const i in docs) {
      let conversionFactor = 1;
      if (
        docs[i].selectedVendor.length > 0 &&
        docs[i].selectedVendor[0].uom.toString() !=
        materials[docs[i].materialId.toString()].uomBase.toString()
      ) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            docs[i].selectedVendor[0].uom,
            materials[docs[i].materialId.toString()].uomBase,
          );
        conversionFactor = convert.conversionFactor;
      }
      let poQuantityBase = docs[i].parLevel - docs[i].inventory[0]?.stock;
      if (!poQuantityBase) poQuantityBase = 0;
      let poQuantity = poQuantityBase / conversionFactor;
      if (!poQuantity) poQuantity = 0;
      response.push({
        restaurant: restaurants[docs[i].restaurantId.toString()],
        material: materials[docs[i].materialId.toString()],
        materialRestaurant: {
          minStockLevel: docs[i].minStockLevel,
          parLevel: docs[i].parLevel,
          onHand: docs[i].inventory[0]?.stock ?? 0,
          poQuantityBase: poQuantityBase < 0 ? 0 : poQuantityBase,
          uomBase:
            unitOfMeasures[
            materials[docs[i].materialId.toString()].uomBase.toString()
            ],
        },
        vendor: vendors[docs[i].selectedVendor[0]?.vendorId.toString()],
        vendorRecord: {
          cost: docs[i].selectedVendor[0]?.cost,
          quantity: docs[i].selectedVendor[0]?.quantity,
          uom: unitOfMeasures[docs[i].selectedVendor[0]?.uom.toString()],
          defaultParQuantity: poQuantity < 0 ? 0 : poQuantity,
          poQuantity: 0,
          vendorMaterialId: docs[i].selectedVendor[0].vendorMaterialId,
        },
      });
    }
    records.docs = response;

    return records;
  }

  async findOne(
    purchaseOrderId: string,
    i18n: I18nContext,
  ): Promise<LeanDocument<PurchaseOrderDocument>> {
    const exists: any = await this.purchaseOrderModel
      .findById(purchaseOrderId)
      .populate([
        {
          path: 'vendorId',
          select: {
            name: 1,
            nameAr: 1,
            _id: 1,
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
        {
          path: 'items.materialId',
          select: {
            name: 1,
            nameAr: 1,
            _id: 1,
          },
        },
        {
          path: 'items.vendorMaterialId',
          select: {
            name: 1,
            nameAr: 1,
            _id: 1,
          },
        },
        {
          path: 'items.uom',
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
          path: 'items.storageArea',
          select: {
            name: 1,
            nameAr: 1,
            _id: 1,
          },
        },
      ])
      .lean();

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    const goodsReceipts = await this.goodsReceiptModel.find({
      purchaseOrderId,
    });

    const invoiceReceipts = await this.invoiceReceiptModel.find({
      purchaseOrderId,
    });

    exists.items.forEach((i: any) => {
      i.received = 0;
      i.pendingToReceive = 0;
      i.invoiced = 0;
      i.pendingToInvoice = 0;
      const items = goodsReceipts.map((g) => g.items).flat();

      items.forEach((itemObj) => {
        if (itemObj.materialId.toString() == i.materialId._id.toString()) {
          i.received += itemObj.stock;
        }
      });

      const invoicedItems = invoiceReceipts.map((i) => i.items).flat();

      invoicedItems.forEach((itemObj) => {
        if (itemObj.materialId.toString() == i.materialId._id.toString()) {
          i.invoiced += itemObj.stock;
        }
      });
      i.pendingToReceive = i.stock - i.received;
      i.pendingToInvoice = i.stock - i.invoiced;
    });

    exists.goodsReceipts = goodsReceipts.map((g) => g._id);
    exists.invoiceReceipts = invoiceReceipts.map((i) => i._id);

    return exists;
  }

  async approvePreview(req, purchaseOrderId: string, i18n: I18nContext) {
    const purchaseOrder = await this.purchaseOrderModel.findOneAndUpdate(
      { _id: purchaseOrderId, status: PurchaseOrderStatus.Draft },
      { status: PurchaseOrderStatus.New },
      {
        new: true,
      },
    );

    if (!purchaseOrder) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    this.purchaseOrderHelperService.postPurchaseOrderCreate(purchaseOrder);
    return purchaseOrder;
  }

  async confirm(req, purchaseOrderId: string, i18n: I18nContext) {
    const purchaseOrder = await this.purchaseOrderModel.findOneAndUpdate(
      { _id: purchaseOrderId, status: PurchaseOrderStatus.New },
      { status: PurchaseOrderStatus.Confirmed },
      {
        new: true,
      },
    );

    if (!purchaseOrder) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    this.purchaseOrderHelperService.postPurchaseOrderConfirmed(purchaseOrder);
    return purchaseOrder;
  }

  async update(
    req,
    purchaseOrderId: string,
    dto: UpdatePurchaseOrderDto,
    i18n: I18nContext,
  ): Promise<PurchaseOrderDocument> {
    let additionalDetails = {};
    if (dto.items) {
      const material = await this.materialModel.count({
        _id: {
          $in: dto.items.map((i) => {
            return i.materialId;
          }),
        },
        supplierId: req.user.supplierId,
      });
      if (material != dto.items.length) {
        throw new BadRequestException(i18n.t(`SOME_ITEMS_NOT_FOUND`));
      }
      const items: any = dto.items;
      let totalCost = 0;
      items.forEach((i) => {
        const itemTaxableAmount = roundOffNumber(i.cost / (1 + Tax.rate / 100));
        i.tax = (itemTaxableAmount * Tax.rate) / 100;
        i.stockValue = i.stock * i.cost;
        totalCost += i.stockValue;
      });
      const totalTaxableAmount = roundOffNumber(
        totalCost / (1 + Tax.rate / 100),
      );
      const tax = (totalTaxableAmount * Tax.rate) / 100;
      additionalDetails = {
        totalCost,
        tax,
      };
    }
    const purchaseOrder = await this.purchaseOrderModel.findByIdAndUpdate(
      purchaseOrderId,
      { ...dto, ...additionalDetails },
      {
        new: true,
      },
    );

    if (!purchaseOrder) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return purchaseOrder;
  }

  async remove(purchaseOrderId: string, i18n: I18nContext): Promise<boolean> {
    const purchaseOrder = await this.purchaseOrderModel.findByIdAndUpdate(
      purchaseOrderId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!purchaseOrder) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async returnPOById(req, dto: CreatePurchaseOrderDto, i18n: I18nContext) {

    const existsPO = await this.purchaseOrderModel.find({
      supplierId: req.user.supplierId,
      _id: new mongoose.Types.ObjectId(dto.referencePO)
    });
    if (!existsPO) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    // validation item limit

    const goodsReceipt = await this.goodsReceiptModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          purchaseOrderId: new mongoose.Types.ObjectId(dto.referencePO)
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.materialId',
          totalStock: { $sum: '$items.stock' }
        }
      }
    ]);

    if (goodsReceipt) {
      for (let i = 0; i < dto.items.length; i++) {
        const grStock = goodsReceipt.find((f: any) => f._id?.toString()
          == dto.items[i].materialId?.toString());
        if (grStock && dto.items[i].stock > grStock.totalStock) {
          throw new NotFoundException(i18n.t('error.LIMIT_EXCEED'));
        }
      }
    }
    else {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return await this.create(req, dto, i18n);
  }

  async updateApproval(req: any, Id: string, i18n: I18nContext): Promise<any> {

    let doc: any = await this.purchaseOrderModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.purchaseOrderModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    doc.transType = TransStatus.Approved;

    if (doc.isSimplified) {

      const grDTO: CreateGoodsReceiptDto = {
        additionalCost: doc.additionalCost,
        date: doc.date,
        isReturn: doc.isReturn,
        purchaseOrderId: doc._id,
        restaurantId: doc.restaurantId,
        taxIndication: doc.taxIndication,
        transType: TransStatus.Approved,
        items: doc.items,
        referenceNumber: doc.referenceNumber,
        attachment: doc.attachment
      }
      console.log("grDTO", JSON.stringify(grDTO));

      const grResp = await this.goodsReceiptService.create(req, grDTO, i18n);
      if (grResp) {
        console.log('Invoice Receipt Started');
        doc = Object.assign(doc, { goodsReceipt: grResp });
        console.log("grDTO2", grDTO);
        const irResp: any = await this.invoiceReceiptService.create(
          req,
          grDTO,
          i18n,
        );
        doc = Object.assign(doc, {
          invoiceReceipt: irResp,
        });
        if (irResp && doc.paymentMethod && doc.paymentMethod != PaymentMethod.Credit) {
          const glAccountId = await this.glAccountMappingModel.findOne({
            supplierId: req.user.supplierId,
          });
          const mvpDTO: any = {
            amount: doc.totalCost,
            date: doc.date,
            purchaseOrderId: doc._id,
            restaurantId: doc.restaurantId,
            vendorId: doc.vendorId,
            items: [],
            invoices: [{ invoiceId: irResp._id, type: RefInvoiceType.InvoiceReceipt }],
            payFrom: doc.paymentMethod,
            otherGLAccount: doc.otherGLAccount,
            text: '',
            isReturn: doc.isReturn,
            transType: TransStatus.Approved
          };
          const manualVendorPay = await this.manualVendorPaymentService.createNew(
            req,
            mvpDTO,
            i18n,
          );
          doc = Object.assign(doc, {
            vendorPay: manualVendorPay,
          });
        }
      }
    }


    return true;
  }
}
