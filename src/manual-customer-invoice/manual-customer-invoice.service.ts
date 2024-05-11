import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateManualCustomerInvoiceDto } from './dto/create-manual-customer-invoice.dto';
import { UpdateManualCustomerInvoiceDto } from './dto/update-manual-customer-invoice.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceDocument,
} from './schemas/manual-customer-invoice.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { I18nContext } from 'nestjs-i18n';
import { QueryManualCustomerInvoiceDto } from './dto/query-manual-customer-invoice.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import mongoose from 'mongoose';
import { DocTypes, PrintAction, TransStatus } from 'src/core/Constants/enum';
import { TaxIndication } from 'src/expense/enum/en';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { ManualCustomerPaymentService } from 'src/manual-customer-payment/manual-customer-payment.service';
import { CreateInvoicePrintDto } from './dto/create-print.dto';
import { FatooraService } from 'src/invoice/fatoora.service';
import * as moment from 'moment';
import { NotificationHelperService } from 'src/notification/notification-helper.service';
import { TemplateResolverService } from 'src/template-resolver/template-resolver.service';
import { ManualCustomerPaymentHistory, ManualCustomerPaymentHistoryDocument } from 'src/manual-customer-payment/schemas/manual-customer-pay-history.schema';
import { RefInvoiceType } from 'src/manual-customer-payment/enum/en.enum';
import { CreateManualCustomerPaymentDto } from 'src/manual-customer-payment/dto/create-manual-customer-payment.dto';

@Injectable()
export class ManualCustomerInvoiceService {
  constructor(
    @InjectModel(ManualCustomerInvoice.name)
    private readonly manualCustomerInvoiceModel: Model<ManualCustomerInvoiceDocument>,
    @InjectModel(ManualCustomerInvoice.name)
    private readonly manualCustomerInvoiceModelPag: PaginateModel<ManualCustomerInvoiceDocument>,
    private readonly fatooraService: FatooraService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly templateService: TemplateResolverService,
    private notificationHelperService: NotificationHelperService,
    private readonly manualCustomerPaymentService: ManualCustomerPaymentService,
    @InjectModel(ManualCustomerPaymentHistory.name)
    private payHistoryModel: Model<ManualCustomerPaymentHistoryDocument>,

  ) { }

  async create(
    req: any,
    dto: CreateManualCustomerInvoiceDto,
    i18n: I18nContext,
  ): Promise<ManualCustomerInvoiceDocument> {
    const items = dto.items;
    // let totalCost = 0;
    // items.forEach((i) => {
    //   totalCost += i.amount + (i.tax ?? 0);
    // });
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.manualCustomerInvoiceModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('CI-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'CI-' + postFix + String(counter).padStart(5, '0');
    for (const i in dto.items) {
      if (dto.items[i].taxIndication == TaxIndication.Included) {
        dto.items[i].net = roundOffNumber(
          dto.items[i].amount / (1 + Tax.rate / 100),
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

    const manualCustomerInvoice = await this.manualCustomerInvoiceModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
      netAmount: totalNet,
      tax: totalTax,
      totalCost: totalGross,
      remainCost: totalGross,
      docType: dto.isReturn ? DocTypes.CreditMemo : DocTypes.Standard,
      totalPaid: 0
    });
    if (manualCustomerInvoice && dto.transType == TransStatus.Approved) {
      await this.glVoucherHelperService.handleManualCustomerInvoice(
        manualCustomerInvoice,
      );
    }

    if (dto.isIncludingPayment) {
      try {
        const cpDTO: CreateManualCustomerPaymentDto = {
          restaurantId: dto.restaurantId,
          customerId: dto.customerId,
          date: dto.date,
          invoices: [{ invoiceId: manualCustomerInvoice._id, type: RefInvoiceType.ManualCustomerInvoice }],
          purchaseOrderId: dto.purchaseOrderId,
          text: dto.text,
          transType: dto.transType,
          attachment: dto.attachment,
          referenceNumber: dto.referenceNumber,
          amount: totalGross,
          items: [],
          payFrom: dto.payFrom,
          otherGLAccount: dto.otherGLAccount
        }
        await this.manualCustomerPaymentService.create(req, cpDTO, i18n);
      } catch (error) {
        console.log(error);
      }

    }

    return manualCustomerInvoice;
  }

  async findAll(
    req: any,
    query: QueryManualCustomerInvoiceDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ManualCustomerInvoiceDocument>> {
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
    if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minAmount > 0) {
        amountRangeQuery.$gte = req.query.minAmount;
      }
      if (req.query.maxAmount > 0) {
        amountRangeQuery.$lte = req.query.maxAmount;
      }
      queryToApply.totalCost = amountRangeQuery;
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

    if (req.query.customerIds) {
      queryToApply.customerId = {
        $in: req.query.customerIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
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
    const records = await this.manualCustomerInvoiceModelPag.paginate(
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
            path: 'customerId',
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
            path: 'referenceCI',
            select: {
              docNumber: 1,
              _id: 1,
              referenceNumber: 1
            },
          },
        ],
      },
    );
    return records;
  }

  async findOne(
    manualCustomerInvoiceId: string,
    i18n: I18nContext,
  ): Promise<ManualCustomerInvoiceDocument> {
    const exists = await this.manualCustomerInvoiceModel
      .findById(manualCustomerInvoiceId)
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
          path: 'customerId',
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
    const response: any = exists.toObject();
    response.history = await this.payHistoryModel.find({ docNumber: exists.docNumber, invoiceId: exists._id }).populate({
      path: 'glAccountId'
    });

    return response;
  }

  async update(
    manualCustomerInvoiceId: string,
    dto: UpdateManualCustomerInvoiceDto,
    i18n: I18nContext,
  ): Promise<ManualCustomerInvoiceDocument> {
    const exists = await this.manualCustomerInvoiceModel
      .findById(manualCustomerInvoiceId);
    let additionalData: any = {};

    for (const i in dto.items) {
      if (dto.items[i].taxIndication == TaxIndication.Included) {
        dto.items[i].net = roundOffNumber(
          dto.items[i].amount / (1 + Tax.rate / 100),
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
    if (dto.items && dto.items?.length > 0) {
      const totalTax = dto.items.reduce((acc, o) => acc + o.tax, 0);
      const totalGross = dto.items.reduce((acc, o) => acc + o.amount, 0);
      const totalNet = dto.items.reduce((acc, o) => acc + o.net, 0);
      additionalData = {
        netAmount: totalNet,
        tax: totalTax,
        totalCost: totalGross,
        remainCost: totalGross - exists.totalPaid,
      }
    }

    const manualCustomerInvoice =
      await this.manualCustomerInvoiceModel.findByIdAndUpdate(
        manualCustomerInvoiceId,
        {
          ...dto,
          ...additionalData
        },
        {
          new: true,
        },
      );

    if (!manualCustomerInvoice) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return manualCustomerInvoice;
  }

  async remove(
    manualCustomerInvoiceId: string,
    i18n: I18nContext,
  ): Promise<boolean> {
    const manualCustomerInvoice =
      await this.manualCustomerInvoiceModel.findByIdAndDelete(
        manualCustomerInvoiceId,
      );

    if (!manualCustomerInvoice) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async returnCustomerInvoice(req: any,
    dto: CreateManualCustomerInvoiceDto,
    i18n: I18nContext,
  ): Promise<ManualCustomerInvoiceDocument> {

    const existsPO = await this.manualCustomerInvoiceModel.find({
      supplierId: req.user.supplierId,
      _id: new mongoose.Types.ObjectId(dto.referenceCI)
    });
    if (!existsPO) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    dto.isReturn = true;

    return await this.create(req, dto, i18n);

  }

  async updateApproval(Id: string): Promise<any> {

    const doc = await this.manualCustomerInvoiceModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.manualCustomerInvoiceModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    if (doc) {
      await this.glVoucherHelperService.handleManualCustomerInvoice(
        doc,
      );
    }

    return true;
  }

  async handlePrintAndEmail(dto: CreateInvoicePrintDto) {

    const data = await this.manualCustomerInvoiceModel.
      findById(dto.customerInvoiceId).populate([
        {
          path: 'customerId',
        },
        {
          path: 'supplierId',
        },
      ]);

    // const historyData: any = await this.payHistoryModel.find({ docNumber: data.docNumber }).populate({
    //   path: 'glAccountId'
    // });

    // let history = [];

    // for (let i = 0; i < historyData.length; i++) {
    //   const el = historyData[i];
    //   history.push({
    //     paymentStatus: el.isReturn ? "Credit" : el.paymentStatus,
    //     glAccountNo: el?.glAccountId?.glNumber,
    //     glAccount: el?.glAccountId?.name,
    //     glAccountAr: el?.glAccountId?.nameAr,
    //     amount: el.paidAmount,
    //     date: moment(el?.createdAt).format('DD/MM/YYYY'),
    //   });
    // }

    let templateURL = "src/manual-customer-invoice/templates/customer-invoice.en.html";

    if (dto.lang == "ar") {
      templateURL = "src/manual-customer-invoice/templates/customer-invoice.ar.html";
    }

    let qrCode = null;
    if (data.supplierId?.vatNumber) {
      // generate QR code base64 image
      qrCode = await this.fatooraService.generateInvoiceQrImage({
        sellerName: data.supplierId.nameAr ?? data.supplierId.name,
        vatRegistrationNumber: data.supplierId?.vatNumber,
        invoiceTimestamp: data.date.toString(),
        invoiceTotal: (data.totalCost).toString(),
        invoiceVatTotal: (data.tax).toString(),
      });
    }
    let items = [];

    for (let i = 0; i < data?.items.length; i++) {
      const el = data?.items[i];
      items.push({
        text: el.text,
        net: el.net?.toFixed(2),
        tax: el.tax?.toFixed(2),
        amount: el.amount?.toFixed(2)
      });
    }

    const html = {
      qrCode,
      supplierName: dto.lang == "ar" ?
        data?.supplierId?.nameAr : data?.supplierId?.name,
      invoiceNumber: data?.docNumber,
      invoiceDate: moment(data?.date).format('DD/MM/YYYY'),
      referenceNumber: data?.referenceNumber,
      vatNumber: data.supplierId?.vatNumber,
      items,
      netAmount: data?.netAmount?.toFixed(2),
      tax: data?.tax?.toFixed(2),
      totalCost: data?.totalCost?.toFixed(2),
      totalPaid: data?.totalPaid?.toFixed(2),
      remainCost: data?.remainCost?.toFixed(2),
      customerName: data?.customerId?.name,
      customerAddress1: data?.customerId?.deliveryAddress?.address,
      customerAddress2: data?.customerId?.deliveryAddress?.city + " " +
        data?.customerId?.deliveryAddress?.state + " " +
        data?.customerId?.deliveryAddress?.zipCode + " " +
        data?.customerId?.deliveryAddress?.district,
      customerVatNumber: data?.customerId?.vatNumber,
      customerCompany: data?.customerId?.companyName,
      logoURL: data.supplierId?.logoPng,
      dueDate: moment(data?.dueDate).format('DD/MM/YYYY')
    };


    const dir = data.supplierId._id + '/' + data.restaurantId._id + '/invoice/';

    const document = await this.templateService.render(templateURL, html, dir, false);
    console.log("document", document);
    if (document.pdfUrl) {
      const pdfURL = document.pdfUrl;
      if (dto.action == PrintAction.Email) {
        await this.notificationHelperService.triggerEmailNotification(null,
          dto.to?.split(';'), dto.emailbody, dto.emailSubject,
          [
            {
              filename: pdfURL,
            }
          ]
        );
      }

      return pdfURL;
    }
    return "";
  }

}
