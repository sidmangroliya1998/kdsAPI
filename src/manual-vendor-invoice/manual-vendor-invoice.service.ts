import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateManualVendorInvoiceDto } from './dto/create-manual-vendor-invoice.dto';
import { UpdateManualVendorInvoiceDto } from './dto/update-manual-vendor-invoice.dto';
import {
  ManualVendorInvoice,
  ManualVendorInvoiceDocument,
} from './schemas/manual-vendor-invoice.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { I18nContext } from 'nestjs-i18n';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';

import { QueryManualVendorInvoiceDto } from './dto/query-manual-vendor-invoice.dto';
import { GlVoucherService } from 'src/accounting/gl-voucher.service';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { IRVI, IRVIDocument } from 'src/invoice-receipt/schema/ir-vi.schema';
import { IRVIType } from 'src/invoice-receipt/enum/en';
import { DocTypes, TransStatus } from 'src/core/Constants/enum';
import { TaxIndication } from 'src/expense/enum/en';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { ManualVendorPaymentService } from 'src/manual-vendor-payment/manual-vendor-payment.service';
import { CreateManualVendorPaymentDto } from 'src/manual-vendor-payment/dto/create-manual-vendor-payment.dto';
import { RefInvoiceType } from 'src/manual-customer-payment/enum/en.enum';

@Injectable()
export class ManualVendorInvoiceService {
  constructor(
    @InjectModel(ManualVendorInvoice.name)
    private readonly manualVendorInvoiceModel: Model<ManualVendorInvoiceDocument>,
    @InjectModel(ManualVendorInvoice.name)
    private readonly manualVendorInvoiceModelPag: PaginateModel<ManualVendorInvoiceDocument>,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(IRVI.name)
    private readonly irviModel: Model<IRVIDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private readonly manualVendorPaymentService: ManualVendorPaymentService
  ) { }

  async create(
    req: any,
    dto: CreateManualVendorInvoiceDto,
    i18n: I18nContext,
  ): Promise<ManualVendorInvoiceDocument> {
    let amount = 0,
      tax = 0;

    if (!dto.isReturn) {
      if (dto.referenceNumber && dto.referenceNumber != '') {
        const existRef = await this.manualVendorInvoiceModel.find({
          supplierId: req.user.supplierId,
          restaurantId: dto.restaurantId,
          referenceNumber: dto.referenceNumber
        });

        if (existRef && existRef?.length > 0) {
          throw new BadRequestException('Reference number already exists');
        }
      }
    }

    let invoiceNumber = 1;
    const lastManualInvoice = await this.manualVendorInvoiceModel.findOne(
      {
        supplierId: req.user.supplierId,
      },
      {},
      {
        sort: {
          _id: -1,
        },
      },
    );
    if (lastManualInvoice && lastManualInvoice.invoiceNumber) {
      invoiceNumber = lastManualInvoice.invoiceNumber + 1;
    }
    dto.items.forEach((i) => {
      amount += i.amount ?? 0;
      tax += i.tax ?? 0;
    });

    for (const i in dto.items) {
      if (dto.items[i].taxIndication == TaxIndication.Included) {
        dto.items[i].net = roundOffNumber(
          dto.items[i].amount / (1 + Tax.rate / 100),
        );
        dto.items[i].tax = roundOffNumber(
          dto.items[i].amount - dto.items[i].net,
        );
      } else if (dto.items[i].taxIndication == TaxIndication.NotRelavant) {
        dto.items[i].net = roundOffNumber(dto.items[i].amount);
        dto.items[i].tax = 0;
      } else if (dto.items[i].taxIndication == TaxIndication.NotIncluded) {
        dto.items[i].net = roundOffNumber(dto.items[i].amount);
        dto.items[i].amount += dto.items[i].tax ?? 0;
      }
      dto.items[i].amount = roundOffNumber(dto.items[i].amount);
    }
    const totalTax = dto.items.reduce((acc, o) => acc + o.tax, 0);
    const totalGross = dto.items.reduce((acc, o) => acc + o.amount, 0);
    const totalNet = dto.items.reduce((acc, o) => acc + o.net, 0);

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    if (
      lastManualInvoice &&
      lastManualInvoice.docNumber &&
      lastManualInvoice.docNumber != ''
    ) {
      lastManualInvoice.docNumber = lastManualInvoice.docNumber.replace(
        'VI-',
        '',
      );
      const arr = lastManualInvoice.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'VI-' + postFix + String(counter).padStart(5, '0');
    const manualVendorInvoice = await this.manualVendorInvoiceModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      invoiceNumber,
      amount: totalNet,
      tax: totalTax,
      totalCost: totalGross,
      docNumber: _docNumber,
      docType: dto.isReturn ? DocTypes.CreditMemo : DocTypes.Standard,
      remainCost: totalGross,
      totalPaid: 0
    });

    //Add Entry in Common IRVI Schema

    let irviItems = [];
    for (let i = 0; i < dto.items.length; i++) {
      const el = dto.items[i];
      irviItems.push({
        materialId: null,
        expense: el.expense,
        amount: el.amount,
        tax: el.tax,
        stock: 1,
        uom: null,
        unitCost: el.amount
      });
    }

    await this.irviModel.create({
      ...dto,
      items: irviItems,
      netAmount: totalGross - totalTax,
      totalCost: totalGross,
      tax: totalTax,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
      dataId: manualVendorInvoice._id,
      docType: IRVIType.VI,
      remainCost: dto.isReturn ? 0 : totalGross
    });


    if (manualVendorInvoice && dto.transType == TransStatus.Approved) {
      await this.glVoucherHelperService.handleManualVendorInvoice(
        manualVendorInvoice,
      );
    }

    if (dto.isIncludingPayment) {
      try {
        const dtoNew: CreateManualVendorPaymentDto = {
          restaurantId: dto.restaurantId,
          vendorId: dto.vendorId,
          date: dto.date,
          invoices: [{ invoiceId: manualVendorInvoice._id, type: RefInvoiceType.ManualVendorInvoice }],
          purchaseOrderId: dto.purchaseOrderId,
          text: dto.text,
          transType: dto.transType,
          attachment: dto.attachment,
          referenceNumber: dto.referenceNumber,
          amount: totalGross,
          items: [],
          isReturn: dto.isReturn,
          otherGLAccount: dto.otherGLAccount,
          payFrom: dto.payFrom
        };

        await this.manualVendorPaymentService.createNew(req, dtoNew, i18n);
      } catch (error) {
        console.log(error);
      }
    }


    return manualVendorInvoice;
  }

  async findAll(
    req: any,
    query: QueryManualVendorInvoiceDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ManualVendorInvoiceDocument>> {
    let queryToApply: any = {};
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


    // if (req.query.restaurantIds) {
    //   queryToApply.restaurantId = {
    //     $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
    //   };
    // }
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }
    if (req.query.vendorIds) {
      queryToApply.vendorId = {
        $in: req.query.vendorIds.split(',').map(id => new mongoose.Types.ObjectId(id))
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
      const poData = await this.purchaseOrderModel.find(poNumberQuery);

      if (poData.length > 0) {
        queryToApply = { ...queryToApply, purchaseOrderId: { $in: poData.map(po => po._id) } };
      }
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
    if (req.query && req.query.paymentStatus && req.query.paymentStatus != '') {
      queryToApply.paymentStatus = req.query.paymentStatus;
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
    const records = await this.manualVendorInvoiceModelPag.paginate(
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
            path: 'vendorId',
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
            path: 'items.expense',
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
            path: 'referenceVI',
            select: {
              invoiceNumber: 1,
              referenceNumber: 1,
              docNumber: 1,
              _id: 1,
            },
          },
        ],
      },
    );
    return records;
  }

  async findOne(
    manualVendorInvoiceId: string,
    i18n: I18nContext,
  ): Promise<ManualVendorInvoiceDocument> {
    const exists = await this.manualVendorInvoiceModel
      .findById(manualVendorInvoiceId)
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
          path: 'vendorId',
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
          path: 'items.expense',
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
    manualVendorInvoiceId: string,
    dto: UpdateManualVendorInvoiceDto,
    i18n: I18nContext,
  ): Promise<ManualVendorInvoiceDocument> {
    const exists = await this.manualVendorInvoiceModel
      .findById(manualVendorInvoiceId);

    let additionalData: any = {};
    let irviItems = [];
    for (const i in dto.items) {
      const el = dto.items[i];

      if (dto.items[i].taxIndication == TaxIndication.Included) {
        dto.items[i].net = roundOffNumber(
          dto.items[i].amount / (1 + Tax.rate / 100),
        );
        dto.items[i].tax = roundOffNumber(
          dto.items[i].amount - dto.items[i].net,
        );
      } else if (dto.items[i].taxIndication == TaxIndication.NotRelavant) {
        dto.items[i].net = roundOffNumber(dto.items[i].amount);
        dto.items[i].tax = 0;
      } else if (dto.items[i].taxIndication == TaxIndication.NotIncluded) {
        dto.items[i].net = roundOffNumber(dto.items[i].amount);
        dto.items[i].amount += dto.items[i].tax ?? 0;
      }
      dto.items[i].amount = roundOffNumber(dto.items[i].amount);

      irviItems.push({
        materialId: null,
        expense: el.expense,
        amount: el.amount,
        tax: el.tax,
        stock: 1,
        uom: null,
        unitCost: el.amount
      });
    }
    if (dto.items) {
      const totalTax = dto.items.reduce((acc, o) => acc + o.tax, 0);
      const totalGross = dto.items.reduce((acc, o) => acc + o.amount, 0);
      const totalNet = dto.items.reduce((acc, o) => acc + o.net, 0);

      additionalData = {
        amount: totalNet,
        tax: totalTax,
        totalCost: totalGross,
        remainCost: totalGross - exists.totalPaid,
      }
    }

    await this.irviModel.updateOne(
      { dataId: manualVendorInvoiceId },
      {
        $set: {
          items: irviItems,
          netAmount: additionalData.amount,
          totalCost: additionalData.totalCost,
          tax: additionalData.tax,
          remainCost: additionalData.totalCost - exists.totalPaid,
        }
      }
    );

    const manualVendorInvoice =
      await this.manualVendorInvoiceModel.findByIdAndUpdate(
        manualVendorInvoiceId,
        {
          ...dto,
          ...additionalData
        },
        {
          new: true,
        },
      );

    if (!manualVendorInvoice) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return manualVendorInvoice;
  }

  async remove(
    manualVendorInvoiceId: string,
    i18n: I18nContext,
  ): Promise<boolean> {
    const manualVendorInvoice =
      await this.manualVendorInvoiceModel.findByIdAndDelete(
        manualVendorInvoiceId,
      );

    if (!manualVendorInvoice) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async returnVendorInvoice(req: any,
    dto: CreateManualVendorInvoiceDto,
    i18n: I18nContext,
  ): Promise<ManualVendorInvoiceDocument> {

    const existsPO = await this.manualVendorInvoiceModel.find({
      supplierId: req.user.supplierId,
      _id: new mongoose.Types.ObjectId(dto.referenceVI)
    });
    if (!existsPO) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    dto.isReturn = true;

    return await this.create(req, dto, i18n);

  }

  async updateApproval(Id: string): Promise<any> {

    const doc = await this.manualVendorInvoiceModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.manualVendorInvoiceModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    if (doc) {
      await this.glVoucherHelperService.handleManualVendorInvoice(doc);
    }

    return true;
  }
}
