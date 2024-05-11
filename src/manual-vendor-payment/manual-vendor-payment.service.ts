import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateManualVendorPaymentDto } from './dto/create-manual-vendor-payment.dto';
import { UpdateManualVendorPaymentDto } from './dto/update-manual-vendor-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ManualVendorPayment,
  ManualVendorPaymentDocument,
} from './schemas/manual-vendor-payment.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { I18nContext } from 'nestjs-i18n';
import { QueryManualVendorPaymentDto } from './dto/query-manual-vendor-payment.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { RefInvoiceType } from 'src/manual-customer-payment/enum/en.enum';
import {
  ManualVendorInvoice,
  ManualVendorInvoiceDocument,
} from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptDocument,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { IRVI, IRVIDocument } from 'src/invoice-receipt/schema/ir-vi.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class ManualVendorPaymentService {
  constructor(
    @InjectModel(ManualVendorPayment.name)
    private readonly manualVendorPaymentModel: Model<ManualVendorPaymentDocument>,
    @InjectModel(ManualVendorPayment.name)
    private readonly manualVendorPaymentModelPag: PaginateModel<ManualVendorPaymentDocument>,
    @InjectModel(ManualVendorInvoice.name)
    private readonly manualVendorInvoiceModel: Model<ManualVendorInvoiceDocument>,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(IRVI.name)
    private readonly irviModel: Model<IRVIDocument>,
    @InjectModel(IRVI.name)
    private readonly irviModelPag: PaginateModel<IRVIDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }


  async createNew(req: any,
    dto: CreateManualVendorPaymentDto,
    i18n: I18nContext): Promise<ManualVendorPaymentDocument> {

    const allIds = dto.invoices?.map((i) => i.invoiceId?.toString());

    if (dto.invoices?.length > 0) {
      let total = 0;

      const invoiceReceipt = await this.irviModel.aggregate([
        {
          $match: {
            dataId: { $in: allIds },
            'remainCost': {
              $gt: 0,
            },
            'paymentStatus': {
              $ne: OrderPaymentStatus.Paid
            }
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$remainCost' },
          },
        },
      ]);

      if (invoiceReceipt && invoiceReceipt.length > 0) {
        total = invoiceReceipt[0].remainCost;
      }

      if (roundOffNumber(total, 2) < roundOffNumber(dto.amount, 2)) {
        throw new BadRequestException(
          `Amount can not be less than total of all invoices`,
        );
      }
    }
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.manualVendorPaymentModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('VP-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'VP-' + postFix + String(counter).padStart(5, '0');
    const manualVendorPayment = await this.manualVendorPaymentModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
      paymentType: dto.payFrom
    });

    let historyData = [];
    if (manualVendorPayment && dto.transType == TransStatus.Approved) {
      await this.glVoucherHelperService.handleManualVendorPayment(
        manualVendorPayment,
      );
      const invoiceReceiptIds = dto.invoices
        ?.filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
        .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

      const vendorInvoiceIds = dto.invoices
        ?.filter((i) => i.type == RefInvoiceType.ManualVendorInvoice)
        .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

      const invoiceReceiptIdstring = dto.invoices
        ?.filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
        .map((i) => i.invoiceId?.toString());

      const vendorInvoiceIdstring = dto.invoices
        ?.filter((i) => i.type == RefInvoiceType.ManualVendorInvoice)
        .map((i) => i.invoiceId?.toString());

      if (dto.invoices?.length > 1) {

        if (vendorInvoiceIds.length > 0) {
          await this.manualVendorInvoiceModel.updateMany(
            { _id: { $in: vendorInvoiceIds } },
            [
              {
                $set: {
                  paymentStatus: OrderPaymentStatus.Paid,
                  remainCost: 0,
                  totalPaid: { $ifNull: ["$totalCost", 0] }
                },
              }
            ]
          );

          await this.irviModel.updateMany(
            {
              dataId: { $in: vendorInvoiceIdstring }
            },
            {
              $set: {
                remainCost: 0,
                paymentStatus: OrderPaymentStatus.Paid,
              },
            });
          const irviDatas = await this.irviModel.find({ dataId: { $in: vendorInvoiceIdstring } });

          for (let i = 0; i < irviDatas.length; i++) {
            const el = irviDatas[i];
            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: el.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: el.totalCost,
              netAmount: el.totalCost - el.tax,
              tax: el.tax,
              remainCost: el.remainCost,
              date: dto.date,
              paymentStatus: el.paymentStatus,
              docNumber: el.docNumber,
              taxIndication: el.taxIndication,
              paidAmount: el.totalCost
            });
          }
        }

        if (invoiceReceiptIds.length > 0) {
          await this.invoiceReceiptModel.updateMany(
            { _id: { $in: invoiceReceiptIds } },
            {
              $set: {
                paymentStatus: OrderPaymentStatus.Paid,
              },
            },
          );
          await this.irviModel.updateMany(
            {
              dataId: { $in: invoiceReceiptIdstring }
            },
            {
              $set: {
                remainCost: 0,
                paymentStatus: OrderPaymentStatus.Paid,
              },
            });
          const irviDatas = await this.irviModel.find({ dataId: { $in: invoiceReceiptIdstring } });

          for (let i = 0; i < irviDatas.length; i++) {
            const el = irviDatas[i];
            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: el.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: el.totalCost,
              netAmount: el.totalCost - el.tax,
              tax: el.tax,
              remainCost: el.remainCost,
              date: dto.date,
              paymentStatus: el.paymentStatus,
              docNumber: el.docNumber,
              taxIndication: el.taxIndication,
              paidAmount: el.totalCost
            });
          }
        }
      } else {
        if (invoiceReceiptIds?.length > 0) {
          const invoiceReceipt = await this.invoiceReceiptModel.findById(
            invoiceReceiptIds[0],
          );
          if (invoiceReceipt) {
            const remainCost = invoiceReceipt.remainCost;
            const newRemainCost = remainCost - dto.amount;
            invoiceReceipt.paymentStatus =
              newRemainCost > 0
                ? OrderPaymentStatus.PartiallyPaid
                : OrderPaymentStatus.Paid;
            await invoiceReceipt.save();
          }

          const irvr = await this.irviModel.findOne({
            dataId: invoiceReceiptIdstring[0],
          });

          if (irvr) {
            const remainCost = irvr.remainCost;
            const newRemainCost = remainCost - dto.amount;
            irvr.paymentStatus =
              newRemainCost > 0
                ? OrderPaymentStatus.PartiallyPaid
                : OrderPaymentStatus.Paid;
            irvr.remainCost = Math.abs(newRemainCost)
            await irvr.save();

            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: irvr.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: irvr.totalCost,
              tax: irvr.tax,
              remainCost: irvr.remainCost,
              netAmount: irvr.totalCost - irvr.tax,
              date: dto.date,
              paymentStatus: irvr.paymentStatus,
              docNumber: irvr.docNumber,
              taxIndication: irvr.taxIndication,
              paidAmount: dto.amount
            });
          }
        }
        if (vendorInvoiceIds?.length > 0) {
          const vendorInvoice = await this.manualVendorInvoiceModel.findById(
            vendorInvoiceIds[0],
          );
          if (vendorInvoice) {
            const remainCost = vendorInvoice.remainCost;
            const newRemainCost = remainCost - dto.amount;
            vendorInvoice.paymentStatus =
              newRemainCost > 0
                ? OrderPaymentStatus.PartiallyPaid
                : OrderPaymentStatus.Paid;
            vendorInvoice.remainCost = newRemainCost
            vendorInvoice.totalPaid = vendorInvoice.totalPaid ? vendorInvoice.totalPaid
              + dto.amount : dto.amount;
            await vendorInvoice.save();
          }

          const irvr = await this.irviModel.findOne({
            dataId: vendorInvoiceIdstring[0],
          });

          if (irvr) {
            const remainCost = irvr.remainCost;
            const newRemainCost = remainCost - dto.amount;
            irvr.paymentStatus =
              newRemainCost > 0
                ? OrderPaymentStatus.PartiallyPaid
                : OrderPaymentStatus.Paid;
            irvr.remainCost = Math.abs(newRemainCost)
            await irvr.save();

            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: irvr.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: irvr.totalCost,
              tax: irvr.tax,
              remainCost: irvr.remainCost,
              netAmount: irvr.totalCost - irvr.tax,
              date: dto.date,
              paymentStatus: irvr.paymentStatus,
              docNumber: irvr.docNumber,
              taxIndication: irvr.taxIndication,
              paidAmount: dto.amount
            });
          }
        }
      }
    }

    if (historyData?.length > 0) {
      manualVendorPayment.history = historyData;
      await manualVendorPayment.save();
    }

    return manualVendorPayment;
  }

  async create(
    req: any,
    dto: CreateManualVendorPaymentDto,
    i18n: I18nContext,
  ): Promise<ManualVendorPaymentDocument> {
    const invoiceReceiptIds = dto.invoices
      ?.filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
      .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

    const vendorInvoiceIds = dto.invoices
      ?.filter((i) => i.type == RefInvoiceType.ManualVendorInvoice)
      .map((i) => new mongoose.Types.ObjectId(i.invoiceId));
    if (dto.invoices?.length > 1) {
      let total = 0;
      if (invoiceReceiptIds?.length > 0) {
        const invoiceReceipt = await this.invoiceReceiptModel.aggregate([
          {
            $match: {
              _id: { $in: invoiceReceiptIds },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalCost' },
            },
          },
        ]);
        if (invoiceReceipt) {
          total += invoiceReceipt[0].total;
        }
      }
      if (vendorInvoiceIds?.length > 0) {
        const vendorInvoice = await this.manualVendorInvoiceModel.aggregate([
          {
            $match: {
              _id: { $in: vendorInvoiceIds },
            },
          },

          {
            $group: {
              _id: null,
              total: { $sum: '$totalCost' },
            },
          },
        ]);
        if (vendorInvoice) {
          total += vendorInvoice[0].total;
        }
      }
      if (total < dto.amount) {
        throw new BadRequestException(
          `Amount can not be less than total of all invoices`,
        );
      }
    }
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.manualVendorPaymentModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('VP-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'VP-' + postFix + String(counter).padStart(5, '0');
    const manualVendorPayment = await this.manualVendorPaymentModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
    });
    if (manualVendorPayment) {
      await this.glVoucherHelperService.handleManualVendorPayment(
        manualVendorPayment,
      );
      if (dto.invoices?.length > 1) {
        if (vendorInvoiceIds.length > 0) {
          await this.manualVendorInvoiceModel.updateMany(
            { _id: { $in: vendorInvoiceIds } },
            {
              $set: {
                paymentStatus: OrderPaymentStatus.Paid,
              },
            },
          );
        }

        if (invoiceReceiptIds.length > 0) {
          await this.invoiceReceiptModel.updateMany(
            { _id: { $in: invoiceReceiptIds } },
            {
              $set: {
                paymentStatus: OrderPaymentStatus.Paid,
              },
            },
          );
        }
      } else {
        if (invoiceReceiptIds?.length > 0) {
          const invoiceReceipt = await this.invoiceReceiptModel.findById(
            invoiceReceiptIds[0],
          );
          if (invoiceReceipt) {
            invoiceReceipt.paymentStatus =
              dto.amount >= invoiceReceipt.totalCost
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;

            invoiceReceipt.save();
          }
        }
        if (vendorInvoiceIds?.length > 0) {
          const vendorInvoice = await this.manualVendorInvoiceModel.findById(
            vendorInvoiceIds[0],
          );
          if (vendorInvoice) {
            vendorInvoice.paymentStatus =
              dto.amount >= vendorInvoice.totalCost
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;

            vendorInvoice.save();
          }
        }
      }
    }
    return manualVendorPayment;
  }

  async findAll(
    req: any,
    query: QueryManualVendorPaymentDto,
    paginateOptions: PaginationDto,
  ): Promise<any> {
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
      queryToApply.amount = amountRangeQuery;
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
    const records = await this.manualVendorPaymentModelPag.paginate(
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
          // {
          //   path: 'payFrom',
          //   select: {
          //     name: 1,
          //     nameAr: 1,
          //     _id: 1,
          //   },
          // },
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
    const aggregateResult = await this.manualVendorPaymentModel.aggregate([
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
            $sum: '$amount',
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
    manualVendorPaymentId: string,
    i18n: I18nContext,
  ): Promise<ManualVendorPaymentDocument> {
    const exists = await this.manualVendorPaymentModel
      .findById(manualVendorPaymentId)
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
        // {
        //   path: 'payFrom',
        //   select: {
        //     name: 1,
        //     nameAr: 1,
        //     _id: 1,
        //   },
        // },
      ]);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    manualVendorPaymentId: string,
    dto: UpdateManualVendorPaymentDto,
    i18n: I18nContext,
  ): Promise<ManualVendorPaymentDocument> {
    const ManualVendorPaymentDocument =
      await this.manualVendorPaymentModel.findByIdAndUpdate(
        manualVendorPaymentId,
        dto,
        {
          new: true,
        },
      );

    if (!ManualVendorPaymentDocument) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return ManualVendorPaymentDocument;
  }

  async remove(
    manualVendorPaymentId: string,
    i18n: I18nContext,
  ): Promise<boolean> {
    const ManualVendorPaymentDocument =
      await this.manualVendorPaymentModel.findByIdAndDelete(
        manualVendorPaymentId,
      );

    if (!ManualVendorPaymentDocument) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async findIRVIAll(req: any, paginateOptions: PaginationDto) {

    let queryToApply: any = {};

    if (req.query.restaurantIds) {
      queryToApply.restaurantId = req.query.restaurantIds;
    }
    if (req.query.vendorIds) {
      queryToApply.vendorId = req.query.vendorIds;
    }
    if (req.query.isNotPaid) {
      const newQuery = {
        'remainCost': {
          $gt: 0,
        },
        'paymentStatus': {
          $ne: OrderPaymentStatus.Paid
        }
      }
      queryToApply = { ...newQuery, ...queryToApply };
    }
    console.log("queryToApply", queryToApply);

    const resp = await this.irviModelPag.paginate(
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
            path: 'purchaseOrderId',
            select: {
              poNumber: 1,
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
            path: 'items.materialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'items.expense'
          },
        ]
      }
    );

    return resp;
  }

  async updateApproval(req: any, Id: string): Promise<any> {

    const manualVendorPayment: any = await this.manualVendorPaymentModel.findById(Id);
    if (!manualVendorPayment) {
      throw new NotFoundException();
    }

    await this.manualVendorPaymentModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    let historyData = [];
    if (manualVendorPayment) {
      await this.glVoucherHelperService.handleManualVendorPayment(
        manualVendorPayment,
      );
      const invoiceReceiptIds = manualVendorPayment.invoices
        ?.filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
        .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

      const vendorInvoiceIds = manualVendorPayment.invoices
        ?.filter((i) => i.type == RefInvoiceType.ManualVendorInvoice)
        .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

      const invoiceReceiptIdstring = manualVendorPayment.invoices
        ?.filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
        .map((i) => i.invoiceId?.toString());

      const vendorInvoiceIdstring = manualVendorPayment.invoices
        ?.filter((i) => i.type == RefInvoiceType.ManualVendorInvoice)
        .map((i) => i.invoiceId?.toString());
      if (manualVendorPayment.invoices?.length > 1) {

        if (vendorInvoiceIds.length > 0) {
          await this.manualVendorInvoiceModel.updateMany(
            { _id: { $in: vendorInvoiceIds } },
            {
              $set: {
                paymentStatus: OrderPaymentStatus.Paid,
              },
            },
          );

          await this.irviModel.updateMany(
            {
              dataId: { $in: vendorInvoiceIdstring }
            },
            {
              $set: {
                remainCost: 0,
                paymentStatus: OrderPaymentStatus.Paid,
              },
            });
          const irviDatas = await this.irviModel.find({ dataId: { $in: vendorInvoiceIdstring } });

          for (let i = 0; i < irviDatas.length; i++) {
            const el = irviDatas[i];
            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: el.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: el.totalCost,
              netAmount: el.totalCost - el.tax,
              tax: el.tax,
              remainCost: el.remainCost,
              date: manualVendorPayment.date,
              paymentStatus: el.paymentStatus,
              docNumber: el.docNumber,
              taxIndication: el.taxIndication
            });
          }

        }

        if (invoiceReceiptIds.length > 0) {
          await this.invoiceReceiptModel.updateMany(
            { _id: { $in: invoiceReceiptIds } },
            {
              $set: {
                paymentStatus: OrderPaymentStatus.Paid,
              },
            },
          );
          await this.irviModel.updateMany(
            {
              dataId: { $in: invoiceReceiptIdstring }
            },
            {
              $set: {
                remainCost: 0,
                paymentStatus: OrderPaymentStatus.Paid,
              },
            });
          const irviDatas = await this.irviModel.find({ dataId: { $in: invoiceReceiptIdstring } });

          for (let i = 0; i < irviDatas.length; i++) {
            const el = irviDatas[i];
            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: el.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: el.totalCost,
              netAmount: el.totalCost - el.tax,
              tax: el.tax,
              remainCost: el.remainCost,
              date: manualVendorPayment.date,
              paymentStatus: el.paymentStatus,
              docNumber: el.docNumber,
              taxIndication: el.taxIndication
            });
          }
        }
      } else {
        if (invoiceReceiptIds?.length > 0) {
          const invoiceReceipt = await this.invoiceReceiptModel.findById(
            invoiceReceiptIds[0],
          );
          if (invoiceReceipt) {
            invoiceReceipt.paymentStatus =
              manualVendorPayment.amount?.toFixed(2) >= invoiceReceipt.totalCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;

            await invoiceReceipt.save();
          }

          const irvr = await this.irviModel.findOne({
            dataId: invoiceReceiptIdstring[0],
          });

          if (irvr) {
            irvr.paymentStatus =
              manualVendorPayment.amount?.toFixed(2) >= irvr.remainCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;
            irvr.remainCost = Math.abs(parseFloat(irvr.remainCost?.toFixed(2)) - parseFloat(manualVendorPayment.amount?.toFixed(2)))
            await irvr.save();

            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: irvr.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: irvr.totalCost,
              tax: irvr.tax,
              remainCost: irvr.remainCost,
              netAmount: irvr.totalCost - irvr.tax,
              date: manualVendorPayment.date,
              paymentStatus: irvr.paymentStatus,
              docNumber: irvr.docNumber,
              taxIndication: irvr.taxIndication
            });
          }
        }
        if (vendorInvoiceIds?.length > 0) {
          const vendorInvoice = await this.manualVendorInvoiceModel.findById(
            vendorInvoiceIds[0],
          );
          if (vendorInvoice) {
            vendorInvoice.paymentStatus =
              manualVendorPayment.amount?.toFixed(2) >= vendorInvoice.totalCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;

            await vendorInvoice.save();
          }

          const irvr = await this.irviModel.findOne({
            dataId: vendorInvoiceIdstring[0],
          });

          if (irvr) {
            irvr.paymentStatus =
              manualVendorPayment.amount?.toFixed(2) >= irvr.remainCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;
            irvr.remainCost = Math.abs(parseFloat(irvr.remainCost?.toFixed(2)) - parseFloat(manualVendorPayment.amount?.toFixed(2)))
            await irvr.save();

            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: irvr.dataId,
              paymentId: manualVendorPayment._id,
              totalCost: irvr.totalCost,
              tax: irvr.tax,
              remainCost: irvr.remainCost,
              netAmount: irvr.totalCost - irvr.tax,
              date: manualVendorPayment.date,
              paymentStatus: irvr.paymentStatus,
              docNumber: irvr.docNumber,
              taxIndication: irvr.taxIndication
            });
          }
        }
      }
    }

    if (historyData?.length > 0) {
      manualVendorPayment.history = historyData;
      await manualVendorPayment.save();
    }

    return true;
  }

}
