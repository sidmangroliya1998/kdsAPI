import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInvoiceReceiptDto } from './dto/create-invoice-receipt.dto';
import { UpdateInvoiceReceiptDto } from './dto/update-invoice-receipt.dto';
import {
  InvoiceReceipt,
  InvoiceReceiptDocument,
} from './schema/invoice-receipt.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { QueryInvoiceReceiptDto } from './dto/query-invoice-receipt.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from 'src/purchase-order/schemas/purchase-order.schema';
import { PurchaseOrderStatus } from 'src/purchase-order/enum/en';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import mongoose from 'mongoose';
import { TaxIndication } from 'src/expense/enum/en';
import { IRVI, IRVIDocument } from './schema/ir-vi.schema';
import { IRVIType } from './enum/en';
import { DocTypes, TransStatus } from 'src/core/Constants/enum';
import { ManualVendorInvoice, ManualVendorInvoiceDocument } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualCustomerInvoice, ManualCustomerInvoiceDocument } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';
import { AggregatePaginateModel } from 'mongoose';
@Injectable()
export class InvoiceReceiptService {
  constructor(
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModelPag: PaginateModel<InvoiceReceiptDocument>,
    @InjectModel(GoodsReceipt.name)
    private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    private readonly glVoucherHelperService: GlVoucherHelperService,

    @InjectModel(IRVI.name)
    private readonly irviModel: Model<IRVIDocument>,
    @InjectModel(IRVI.name)
    private readonly irviModelAggPeg: AggregatePaginateModel<IRVIDocument>,
    @InjectModel(ManualVendorInvoice.name)
    private readonly manualVendorInvoiceModel: Model<ManualVendorInvoiceDocument>,
    @InjectModel(ManualCustomerInvoice.name)
    private readonly manualCustomerInvoiceModel: Model<ManualCustomerInvoiceDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private readonly inventoryHelperService: InventoryHelperService

  ) { }

  async create(
    req: any,
    dto: CreateInvoiceReceiptDto,
    i18n: I18nContext,
  ): Promise<InvoiceReceiptDocument> {
    const exists = await this.invoiceReceiptModel.findOne({
      purchaseOrderId: dto.purchaseOrderId,
    });
    if (exists) {
      throw new NotFoundException(i18n.t('error.RECORD_ALREADY_EXIST'));
    }
    const validated = await this.validate(dto, i18n);
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

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.invoiceReceiptModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('IR-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'IR-' + postFix + String(counter).padStart(5, '0');

    console.log("purchaseOrder", validated.purchaseOrder);

    const invoiceReceipt = await this.invoiceReceiptModel.create({
      ...dto,
      items,
      totalCost,
      tax,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      restaurantId: validated.goodsReceipts[0].restaurantId,
      docNumber: _docNumber,
      remainCost: totalCost,
      vendorId: validated.purchaseOrder.vendorId
    });

    //Add Entry in Common IRVI Schema

    let irviItems = [];
    for (let i = 0; i < dto.items.length; i++) {
      const el = dto.items[i];
      const itemTaxableAmount = dto.taxIndication == TaxIndication.Included ?
        (el.cost / (1 + Tax.rate / 100)) : el.cost;

      irviItems.push({
        materialId: el.materialId,
        expense: null,
        amount: el.cost * el.stock,
        tax: dto.taxIndication == TaxIndication.Included ?
          (itemTaxableAmount * Tax.rate) / 100 : 0,
        stock: el.stock,
        uom: el.uom,
        unitCost: el.cost
      });
    }

    await this.irviModel.create({
      ...dto,
      items: irviItems,
      netAmount: totalCost - tax,
      totalCost,
      tax,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      restaurantId: validated.goodsReceipts[0].restaurantId,
      docNumber: _docNumber,
      dataId: invoiceReceipt._id,
      docType: IRVIType.IR,
      remainCost: totalCost,
      vendorId: validated.purchaseOrder.vendorId
    });
    if (dto.transType == TransStatus.Approved) {
      await this.updateApproval(req, invoiceReceipt._id, i18n);
    }

    return invoiceReceipt;
  }

  async findAll(
    req: any,
    query: QueryInvoiceReceiptDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InvoiceReceiptDocument>> {
    let queryToApply: any = query;
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }

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

      const poData = await this.purchaseOrderModel.find(poNumberQuery);

      if (poData.length > 0) {
        queryToApply = { ...queryToApply, purchaseOrderId: { $in: poData.map(po => po._id) } };
      }
    }


    // if (req.query.restaurantIds) {
    //   queryToApply.restaurantId = {
    //     $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
    //   };
    // }
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
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
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

    const records = await this.invoiceReceiptModelPag.paginate(
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
            path: 'purchaseOrderId',
            select: {
              poNumber: 1,
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
        ],
      },
    );


    const aggregateResult = await this.invoiceReceiptModel.aggregate([
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
            $sum: '$totalCost',
          }
        },
      },
    ]);

    let response = {
      ...records,
      aggregateResult: aggregateResult[0]
    }
    return response;
  }

  async findOne(
    invoiceReceiptId: string,
    i18n: I18nContext,
  ): Promise<InvoiceReceiptDocument> {
    const exists = await this.invoiceReceiptModel
      .findById(invoiceReceiptId)
      .populate([
        {
          path: 'restaurantId',
          select: {
            name: 1,
            nameAr: 1,
            _id: 1,
          },
        },
        {
          path: 'purchaseOrderId',
          select: {
            poNumber: 1,
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
      ]);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    invoiceReceiptId: string,
    dto: UpdateInvoiceReceiptDto,
    i18n: I18nContext,
  ): Promise<InvoiceReceiptDocument> {
    const validated = await this.validate(dto, i18n);
    const items: any = dto.items;
    let totalCost = 0;
    items.forEach((i) => {
      const itemTaxableAmount = roundOffNumber(i.cost / (1 + Tax.rate / 100));
      i.tax = (itemTaxableAmount * Tax.rate) / 100;
      i.stockValue = i.stock * i.cost;
      totalCost += i.stockValue;
    });
    const totalTaxableAmount = roundOffNumber(totalCost / (1 + Tax.rate / 100));
    const tax = (totalTaxableAmount * Tax.rate) / 100;
    const invoiceReceipt = await this.invoiceReceiptModel.findByIdAndUpdate(
      invoiceReceiptId,
      { ...dto, totalCost, tax },
      {
        new: true,
      },
    );

    if (!invoiceReceipt) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    await this.purchaseOrderModel.findOneAndUpdate(
      { _id: dto.purchaseOrderId },
      {
        status: validated.loaded
          ? PurchaseOrderStatus.Invoiced
          : PurchaseOrderStatus.PartiallyInvoiced,
      },
    );

    return invoiceReceipt;
  }

  async remove(invoiceReceiptId: string, i18n: I18nContext): Promise<boolean> {
    const invoiceReceipt = await this.invoiceReceiptModel.findByIdAndDelete(
      invoiceReceiptId,
    );

    if (!invoiceReceipt) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async validate(dto: CreateInvoiceReceiptDto | UpdateInvoiceReceiptDto, i18n) {
    const goodsReceipts = await this.goodsReceiptModel.find({
      purchaseOrderId: dto.purchaseOrderId,
    });
    const purchaseOrder = await this.purchaseOrderModel.findById(
      dto.purchaseOrderId,
    );
    const loadedItems = [];
    let totalAllowed = 0,
      totalLoaded = 0;

    goodsReceipts.forEach((goodsReceipt) => {
      goodsReceipt.items.forEach((item) => {
        if (loadedItems[item.materialId.toString()]) {
          loadedItems[item.materialId.toString()] += item.stock;
        } else {
          loadedItems[item.materialId.toString()] = item.stock;
        }
        totalLoaded += item.stock;
      });
    });
    purchaseOrder.items.forEach((poi) => {
      totalAllowed += poi.stock;
    });
    for (const i in dto.items) {
      if (!loadedItems[dto.items[i].materialId]) {
        throw new BadRequestException(
          `${dto.items[i].materialId} ${i18n.t('NOT_ALLOWED')}`,
        );
      }

      if (dto.items[i].stock > loadedItems[dto.items[i].materialId]) {
        throw new BadRequestException(
          `Max ${loadedItems[dto.items[i].materialId]} quantities allowed for ${dto.items[i].materialId
          }`,
        );
      }
    }
    return { goodsReceipts, loaded: totalAllowed == totalLoaded, purchaseOrder };
  }

  async irviScript() {

    const allIR: any = await this.invoiceReceiptModel.find({}).populate('purchaseOrderId');


    await this.irviModel.deleteMany({});

    const dto = [];
    for (let i = 0; i < allIR.length; i++) {
      const el = allIR[i];
      const irviDTO = {
        supplierId: el.supplierId,
        restaurantId: el.restaurantId,
        purchaseOrderId: el.purchaseOrderId?._id,
        vendorId: el.purchaseOrderId?.vendorId,
        totalCost: el.totalCost,
        tax: el.tax,
        remainCost: el.paymentStatus == 'Paid' ? 0 : el.totalCost,
        date: el.date,
        addedBy: el.addedBy,
        docNumber: el.docNumber,
        paymentStatus: el.paymentStatus,
        additionalCost: el.additionalCost,
        docType: IRVIType.IR,
        dataId: el._id,
        items: el.items.map((data) => {
          return {
            materialId: data.materialId,
            expense: null,
            amount: data.cost * data.stock,
            tax: data.tax,
            stock: data.stock,
            uom: data.uom,
            unitCost: data.cost
          }
        }),
        createdAt: el.createdAt,
        isReturn: el.isReturn
      }

      dto.push(irviDTO);
    }

    const allVI: any = await this.manualVendorInvoiceModel.find({});
    for (let i = 0; i < allVI.length; i++) {
      const el = allVI[i];
      const irviDTO = {
        supplierId: el.supplierId,
        restaurantId: el.restaurantId,
        purchaseOrderId: el.purchaseOrderId,
        vendorId: el.vendorId,
        totalCost: el.totalCost,
        tax: el.tax,
        remainCost: el.paymentStatus == 'Paid' ? 0 : el.totalCost,
        date: el.date,
        addedBy: el.addedBy,
        docNumber: el.docNumber,
        paymentStatus: el.paymentStatus,
        additionalCost: 0,
        docType: IRVIType.VI,
        dataId: el._id,
        items: el.items.map((data) => {
          return {
            materialId: null,
            expense: data?.expense,
            amount: data.amount,
            tax: data.tax,
            stock: 1,
            uom: null,
            unitCost: data.amount
          }
        }),
        createdAt: el.createdAt,
        isReturn: el.isReturn
      }
      dto.push(irviDTO);
    }

    await this.irviModel.insertMany(dto);

    await this.purchaseOrderModel.updateMany(
      { isReturn: { $exists: false } },
      {
        $set: {
          docType: DocTypes.Standard,
          isReturn: false
        },
      },
    );

    await this.invoiceReceiptModel.updateMany(
      { isReturn: { $exists: false } },
      {
        $set: {
          isReturn: false
        },
      },
    );

    await this.manualVendorInvoiceModel.updateMany(
      { isReturn: { $exists: false } },
      {
        $set: {
          docType: DocTypes.Standard,
          isReturn: false
        },
      },
    );

    await this.manualCustomerInvoiceModel.updateMany(
      { isReturn: { $exists: false } },
      {
        $set: {
          docType: DocTypes.Standard,
          isReturn: false
        },
      },
    );

    return true;
  }

  async updateApproval(req: any, Id: string, i18n: I18nContext): Promise<any> {

    const doc: any = await this.invoiceReceiptModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.invoiceReceiptModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });
    const validated = await this.validate(doc, i18n);
    await this.purchaseOrderModel.findOneAndUpdate(
      { _id: doc.purchaseOrderId },
      {
        status: validated.loaded
          ? PurchaseOrderStatus.Invoiced
          : PurchaseOrderStatus.PartiallyInvoiced,
      },
    );
    await doc.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (doc.supplierId.autoTransferInvoiceReceiptGl) {
      await this.glVoucherHelperService.handleInvoiceReceipt(doc);
    }

    for (let i = 0; i < doc.items.length; i++) {
      const el = doc.items[i];
      let addition = {}
      if (doc.isReturn) {
        addition = {
          vendorReturnQty: el.stock,
          vendorReturnValue: el.stockValue
        }
      } else {
        addition = {
          purchaseQuantity: el.stock,
          purchaseValue: el.stockValue
        }
      }
      await this.inventoryHelperService.saveInventoryControl(req,
        {
          restaurantId: validated.goodsReceipts[0].restaurantId,
          materialId: el.materialId,
          ...addition
        });
    }

    return true;
  }

  async createScript() {
    await this.purchaseOrderModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
    await this.goodsReceiptModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
    await this.invoiceReceiptModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
    await this.manualCustomerInvoiceModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
    await this.manualVendorInvoiceModel.updateMany({}, { $set: { transType: TransStatus.Approved } });
  }

  async vendorPurchaseReport(req: any, paginateOptions: PaginationDto) {

    let queryToApply: any = {};
    if (req.query.vendorIds) {
      const vendorIds = req.query.vendorIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['vendorId'] = {
        $in: vendorIds
      };
    }
    let dynamicFilterForTotalPurchase: any = {};
    if (req.query.minTotalPurchase > 0 || req.query.maxTotalPurchase > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minTotalPurchase > 0) {
        amountRangeQuery.$gte = Number(req.query.minTotalPurchase);
      }
      if (req.query.maxTotalPurchase > 0) {
        amountRangeQuery.$lte = Number(req.query.maxTotalPurchase);
      }

      dynamicFilterForTotalPurchase.totalPurchase = amountRangeQuery;
    }

    console.log("queryToApply", queryToApply);
    const result: any = await this.irviModelAggPeg.aggregatePaginate(
      this.irviModel.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            ...queryToApply,
            'vendorId.deletedAt': null,
            $or: [
              { 'items.materialId.deletedAt': null },
              { 'items.materialId.deletedAt': { $exists: false } }
            ]
          },
        },
        {
          $lookup: {
            from: "vendors", // Assuming the collection name is "vendors"
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor"
          }
        },
        {
          $unwind: "$vendor" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "glvendorcodes", // Assuming the collection name is "vendors"
            localField: "vendor.glVendorCodeId",
            foreignField: "_id",
            as: "vendorCode"
          }
        },
        {
          $unwind: "$vendorCode" // Unwind the array produced by $lookup to destructure it
        },
        {
          $addFields: {
            "vendor.lowercaseName": { $toLower: "$vendor.name" },
            "vendor.lowercaseNameAr": { $toLower: "$vendor.nameAr" },
            "vendorCode.lowercaseName": { $toLower: "$vendorCode.name" },
            "vendorCode.lowercaseNameAr": { $toLower: "$vendorCode.nameAr" }
          }
        },
        {
          $group: {
            _id: "$vendorId",
            vendorName: { $first: "$vendor.name" },
            vendorNameAr: { $first: "$vendor.nameAr" },
            vendorCode: { $first: "$vendorCode" },
            totalPurchase: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$isReturn", false] },
                      { $not: { $ifNull: ["$isReturn", false] } }
                    ]
                  }, "$totalCost", 0]
              }
            },
            totalReturn: {
              $sum: {
                $cond: [{ $eq: ["$isReturn", true] }, "$totalCost", 0]
              }
            },
            vendorlowercaseName: { $first: "$vendor.lowercaseName" },
            vendorlowercaseNameAr: { $first: "$vendor.lowercaseNameAr" },
            vendorCodelowercaseName: { $first: "$vendorCode.lowercaseName" },
            vendorCodelowercaseNameAr: { $first: "$vendorCode.lowercaseNameAr" },
          }
        },
        {
          $match: dynamicFilterForTotalPurchase
        },
        {
          $project: {
            vendorId: "$_id",
            vendorName: 1,
            vendorNameAr: 1,
            vendorCode: 1,
            totalPurchase: 1,
            totalReturn: 1,
            netPurchase: { $subtract: ["$totalPurchase", "$totalReturn"] },
            vendorlowercaseName: 1,
            vendorlowercaseNameAr: 1,
            vendorCodelowercaseName: 1,
            vendorCodelowercaseNameAr: 1,
            _id: 0
          }
        }
      ]),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy.replace('vendor.name', 'vendor.lowercaseName')
              .replace('vendor.nameAr', 'vendor.lowercaseNameAr')
              .replace('vendorCode.name', 'vendorCode.lowercaseName')
              .replace('vendorCode.nameAr', 'vendorCode.lowercaseNameAr')
            ]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
          }
          : DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      }
    );

    let sumOfNetPurchase = 0;
    let sumOftotalPurchase = 0;
    let sumOftotalReturn = 0;
    result.docs.forEach(item => {
      sumOfNetPurchase += item.netPurchase;
      sumOftotalPurchase += item.totalPurchase;
      sumOftotalReturn += item.totalReturn;
    });

    let response = [];
    for (let i = 0; i < result.docs.length; i++) {
      const el = result.docs[i];
      response.push({
        ...el, percentage: (el.netPurchase / sumOfNetPurchase) * 100
      });
    }
    result.docs = response;
    return result;

  }

  async vendorPurchasePriceComparision(req: any, paginateOptions: PaginationDto) {
    let queryToApply: any = {};
    if (req.query.vendorIds) {
      const vendorIds = req.query.vendorIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['vendorId'] = {
        $in: vendorIds
      };
    }

    if (req.query.materialIds) {
      const materialIds = req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id));
      queryToApply['items.materialId'] = {
        $in: materialIds
      };
    }

    let dynamicFilterForTotalPurchase: any = {};
    if (req.query.minTotalCost > 0 || req.query.maxTotalCost > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minTotalCost > 0) {
        amountRangeQuery.$gte = Number(req.query.minTotalCost);
      }
      if (req.query.maxTotalCost > 0) {
        amountRangeQuery.$lte = Number(req.query.maxTotalCost);
      }

      dynamicFilterForTotalPurchase.totalPurchase = amountRangeQuery;
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

    console.log("queryToApply", queryToApply);
    const result: any = await this.irviModelAggPeg.aggregatePaginate(
      this.irviModel.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            docType: IRVIType.IR,
            ...queryToApply,
            'vendorId.deletedAt': null,
            $or: [
              { 'items.materialId.deletedAt': null },
              { 'items.materialId.deletedAt': { $exists: false } }
            ]
          },
        },
        {
          $unwind: "$items"
        },
        {
          $lookup: {
            from: "vendors", // Assuming the collection name is "vendors"
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor"
          }
        },
        {
          $unwind: "$vendor" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "glvendorcodes", // Assuming the collection name is "vendors"
            localField: "vendor.glVendorCodeId",
            foreignField: "_id",
            as: "vendorCode"
          }
        },
        {
          $unwind: "$vendorCode" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "materials", // Assuming the collection name is "materials"
            localField: "items.materialId",
            foreignField: "_id",
            as: "material"
          }
        },
        {
          $unwind: "$material" // Unwind the array produced by $lookup to destructure it
        },
        {
          $lookup: {
            from: "unitofmeasures", // Assuming the collection name is "materials"
            localField: "items.uom",
            foreignField: "_id",
            as: "purchaseUoM"
          }
        },
        {
          $unwind: "$purchaseUoM" // Unwind the array produced by $lookup to destructure it
        },
        {
          $addFields: {
            "material.lowercaseName": { $toLower: "$material.name" },
            "material.lowercaseNameAr": { $toLower: "$material.nameAr" },
            "vendor.lowercaseName": { $toLower: "$vendor.name" },
            "vendor.lowercaseNameAr": { $toLower: "$vendor.nameAr" },
            "purchaseUoM.lowercaseName": { $toLower: "$purchaseUoM.name" },
            "purchaseUoM.lowercaseNameAr": { $toLower: "$purchaseUoM.nameAr" },
            "material.sequenceNumber.lowercaseName": { $toLower: "$material.sequenceNumber" }
          }
        },
        {
          $group: {
            _id: { vendorId: "$vendorId", materialId: "$items.materialId" },
            vendorName: { $first: "$vendor.name" },
            vendorNameAr: { $first: "$vendor.nameAr" },
            vendorCode: { $first: "$vendorCode" },
            material: { $first: "$material" },
            purchaseUoM: { $first: "$purchaseUoM" },
            leastCost: { $min: "$items.unitCost" },
            totalPurchase: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$isReturn", false] },
                      { $not: { $ifNull: ["$isReturn", false] } }
                    ]
                  }, "$totalCost", 0]
              }
            },
            totalReturn: {
              $sum: {
                $cond: [{ $eq: ["$isReturn", true] }, "$totalCost", 0]
              }
            },
            totalPurchaseQuantity: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$isReturn", false] },
                      { $not: { $ifNull: ["$isReturn", false] } }
                    ]
                  },
                  "$items.stock", // This should be "$items.quantity" or whatever field represents the quantity of items
                  0
                ]
              }
            },
            totalReturnQuantity: {
              $sum: {
                $cond: [{ $eq: ["$isReturn", true] }, "$items.stock", 0] // Count the quantity for returned items
              }
            }
          }
        },
        {
          $match: dynamicFilterForTotalPurchase
        },
        {
          $project: {
            vendorId: "$_id",
            vendorName: 1,
            vendorNameAr: 1,
            vendorCode: 1,
            totalPurchase: 1,
            totalReturn: 1,
            totalPurchaseQuantity: 1,
            totalReturnQuantity: 1,
            material: 1,
            purchaseUoM: 1,
            leastCost: 1,
            netPurchase: {
              $subtract: [{ $toDouble: "$totalPurchase" },
              { $toDouble: "$totalReturn" }]
            },
            netPurchaseQty: {
              $subtract: [{ $toDouble: "$totalPurchaseQuantity" },
              { $toDouble: "$totalReturnQuantity" }]
            },
            sumOfNetPurchase: { $subtract: [{ $sum: { $toDouble: "$totalPurchase" } }, { $sum: { $toDouble: "$totalReturn" } }] },
            averageUnitPrice: {
              $divide: [{
                $subtract: [{ $toDouble: "$totalPurchase" },
                { $toDouble: "$totalReturn" }]
              },
              {
                $subtract: [{ $toDouble: "$totalPurchaseQuantity" },
                { $toDouble: "$totalReturnQuantity" }]
              }]
            },
            diffAvgAndLeast: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $subtract: [
                        { $toDouble: "$totalPurchaseQuantity" },
                        { $toDouble: "$totalReturnQuantity" }
                      ]
                    },
                    0
                  ]
                },
                then: {
                  $subtract: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $toDouble: "$totalPurchase" },
                            { $toDouble: "$totalReturn" }
                          ]
                        },
                        {
                          $subtract: [
                            { $toDouble: "$totalPurchaseQuantity" },
                            { $toDouble: "$totalReturnQuantity" }
                          ]
                        }
                      ]
                    },
                    "$leastCost"
                  ]
                },
                else: 0 // If the result of the subtraction is not greater than 0, set diffAvgAndLeast to 0
              }
            },

            totalValueDiff: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $subtract: [
                        { $toDouble: "$totalPurchaseQuantity" },
                        { $toDouble: "$totalReturnQuantity" }
                      ]
                    },
                    0
                  ]
                },
                then: {
                  $multiply: [
                    {
                      $subtract: [
                        {
                          $divide: [
                            {
                              $subtract: [
                                { $toDouble: "$totalPurchase" },
                                { $toDouble: "$totalReturn" }
                              ]
                            },
                            {
                              $subtract: [
                                { $toDouble: "$totalPurchaseQuantity" },
                                { $toDouble: "$totalReturnQuantity" }
                              ]
                            }
                          ]
                        },
                        "$leastCost"
                      ]
                    },
                    {
                      $subtract: [
                        { $toDouble: "$totalPurchaseQuantity" },
                        { $toDouble: "$totalReturnQuantity" }
                      ]
                    }
                  ]
                },
                else: 0 // If the result of the subtraction is not greater than 0, set totalValueDiff to 0
              }
            },


            percentage: {
              $cond: {
                if: {
                  $gt: [
                    {
                      $subtract: [
                        {
                          $sum: { $toDouble: "$totalPurchase" }
                        },
                        {
                          $sum: { $toDouble: "$totalReturn" }
                        }
                      ]
                    },
                    0
                  ]
                },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $toDouble: "$totalPurchase" },
                            { $toDouble: "$totalReturn" }
                          ]
                        },
                        {
                          $subtract: [
                            {
                              $sum: { $toDouble: "$totalPurchase" }
                            },
                            {
                              $sum: { $toDouble: "$totalReturn" }
                            }
                          ]
                        }
                      ]
                    },
                    100
                  ]
                },
                else: 0 // If the divisor is not greater than 0, set percentage to 0
              }
            },
            _id: 0
          }
        }
      ]),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy.replace('material.name', 'material.lowercaseName')
              .replace('material.nameAr', 'material.lowercaseNameAr')
              .replace('purchaseUoM.name', 'purchaseUoM.lowercaseName')
              .replace('purchaseUoM.nameAr', 'purchaseUoM.lowercaseNameAr')
              .replace('vendor.name', 'vendor.lowercaseName')
              .replace('vendor.nameAr', 'vendor.lowercaseNameAr')
              .replace('material.sequenceNumber', 'material.sequenceNumber.lowercaseName')
            ]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
          }
          : DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      }
    );


    // let sumOfNetPurchase = 0;
    // let sumOftotalPurchase = 0;
    // let sumOftotalReturn = 0;
    // result.docs.forEach(item => {
    //   sumOfNetPurchase += item.netPurchase;
    //   sumOftotalPurchase += item.totalPurchase;
    //   sumOftotalReturn += item.totalReturn;
    // });

    // let response = [];
    // for (let i = 0; i < result.docs.length; i++) {
    //   const el = result.docs[i];
    //   const avgUnitCost = el.netPurchase / el.netPurchaseQty;
    //   response.push({
    //     ...el, percentage: (el.netPurchase / sumOfNetPurchase) * 100,
    //     averageUnitPrice: avgUnitCost, diffAvgAndLeast: avgUnitCost - el.leastCost,
    //     totalValueDiff: (avgUnitCost - el.leastCost) * el.netPurchaseQty
    //   });
    // }
    // result.docs = response;
    return result;
  }
}
