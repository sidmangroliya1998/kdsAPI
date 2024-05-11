import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateManualCustomerPaymentDto } from './dto/create-manual-customer-payment.dto';
import { UpdateManualCustomerPaymentDto } from './dto/update-manual-customer-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ManualCustomerPayment,
  ManualCustomerPaymentDocument,
} from './schemas/manual-customer-payment.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { I18nContext } from 'nestjs-i18n';
import { QueryManualCustomerPaymentDto } from './dto/query-manual-customer-payment.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import ObjectId from 'mongoose';
import { RefInvoiceType } from './enum/en.enum';
import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceDocument,
} from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptDocument,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { ManualCustomerPaymentHistory, ManualCustomerPaymentHistoryDocument } from './schemas/manual-customer-pay-history.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';

@Injectable()
export class ManualCustomerPaymentService {
  constructor(
    @InjectModel(ManualCustomerPayment.name)
    private readonly manualCustomerPaymentModel: Model<ManualCustomerPaymentDocument>,
    @InjectModel(ManualCustomerPayment.name)
    private readonly manualCustomerPaymentModelPag: PaginateModel<ManualCustomerPaymentDocument>,
    @InjectModel(ManualCustomerInvoice.name)
    private readonly manualCustomerInvoiceModel: Model<ManualCustomerInvoiceDocument>,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(ManualCustomerPaymentHistory.name)
    private payHistoryModel: Model<ManualCustomerPaymentHistoryDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateManualCustomerPaymentDto,
    i18n: I18nContext,
  ): Promise<ManualCustomerPaymentDocument> {

    console.log("dt", dto);

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    const invoiceReceiptIds = dto.invoices
      .filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
      .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

    const customerInvoiceIds = dto.invoices
      .filter((i) => i.type == RefInvoiceType.ManualCustomerInvoice)
      .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

    if (dto.invoices.length > 1) {
      let total = 0;
      if (invoiceReceiptIds.length > 0) {
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
      if (customerInvoiceIds.length > 0) {
        const customerInvoice = await this.manualCustomerInvoiceModel.aggregate(
          [
            {
              $match: {
                _id: { $in: customerInvoiceIds },
              },
            },

            {
              $group: {
                _id: null,
                total: { $sum: '$totalCost' },
              },
            },
          ],
        );

        if (customerInvoice) {
          total += customerInvoice[0].remainCost;
        }
      }
      if (roundOffNumber(total, 2) < roundOffNumber(dto.amount, 2)) {
        throw new BadRequestException(
          `Amount can not be less than total of all invoices`,
        );
      }
    }
    let _lastDocNo = await this.manualCustomerPaymentModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('CP-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'CP-' + postFix + String(counter).padStart(5, '0');
    const manualCustomerPayment = await this.manualCustomerPaymentModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber,
      paymentType: dto.payFrom
    });
    let historyData = [];
    if (manualCustomerPayment && dto.transType == TransStatus.Approved) {
      await this.glVoucherHelperService.handleManualCustomerPayment(
        manualCustomerPayment,
      );

      if (dto.invoices.length > 1) {
        if (customerInvoiceIds.length > 0) {

          await this.manualCustomerInvoiceModel.updateMany(
            { _id: { $in: customerInvoiceIds } },
            [
              {
                $set: {
                  paymentStatus: OrderPaymentStatus.Paid,
                  remainCost: 0,
                  totalPaid: { $ifNull: ["$totalCost", 0] } // Set totalPaid to totalCost or 0 if totalCost is null
                }
              }
            ]
          );

          const irviDatas: any = await this.manualCustomerInvoiceModel.find({ _id: { $in: customerInvoiceIds } }).populate({
            path: 'referenceCI'
          });
          console.log("irviDatas", irviDatas);

          for (let i = 0; i < irviDatas.length; i++) {
            const el = irviDatas[i];
            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: el._id,
              paymentId: manualCustomerPayment._id,
              totalCost: el.totalCost,
              netAmount: el.totalCost - el.tax,
              tax: el.tax,
              remainCost: el.remainCost,
              date: dto.date,
              paymentStatus: el.paymentStatus,
              docNumber: el.docNumber,
              paidAmount: el.totalCost,
              glAccountId: manualCustomerPayment.otherGLAccount,
              isReturn: false
            });
            if (el.isReturn) {
              historyData.push({
                supplierId: req.user.supplierId,
                invoiceId: el._id,
                paymentId: manualCustomerPayment._id,
                totalCost: el.totalCost,
                netAmount: el.totalCost - el.tax,
                tax: el.tax,
                remainCost: el.remainCost,
                date: dto.date,
                paymentStatus: el.paymentStatus,
                docNumber: el?.referenceCI?.docNumber,
                paidAmount: el.totalCost,
                glAccountId: manualCustomerPayment.otherGLAccount,
                isReturn: true
              });
            }
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
        }
      } else {
        if (invoiceReceiptIds.length > 0) {
          const invoiceReceipt = await this.invoiceReceiptModel.findById(
            invoiceReceiptIds[0],
          );
          if (invoiceReceipt) {
            invoiceReceipt.paymentStatus =
              dto.amount?.toFixed(2) >= invoiceReceipt.totalCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;

            await invoiceReceipt.save();
          }
        }
        if (customerInvoiceIds.length > 0) {
          const customerInvoice: any =
            await this.manualCustomerInvoiceModel.findById(
              customerInvoiceIds[0],
            ).populate({
              path: 'referenceCI'
            });
          console.log("customerInvoice", customerInvoice);
          if (customerInvoice) {
            const remainCost = customerInvoice.remainCost;
            const newRemainCost = remainCost - dto.amount;

            customerInvoice.paymentStatus =
              newRemainCost > 0
                ? OrderPaymentStatus.PartiallyPaid
                : OrderPaymentStatus.Paid;
            customerInvoice.remainCost = newRemainCost
            customerInvoice.totalPaid = customerInvoice.totalPaid ? customerInvoice.totalPaid
              + dto.amount : dto.amount;
            await customerInvoice.save();

            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: customerInvoice._id,
              paymentId: manualCustomerPayment._id,
              totalCost: customerInvoice.totalCost,
              tax: customerInvoice.tax,
              remainCost: newRemainCost,
              netAmount: customerInvoice.totalCost - customerInvoice.tax,
              date: dto.date,
              paymentStatus: customerInvoice.paymentStatus,
              docNumber: customerInvoice.docNumber,
              paidAmount: dto.amount,
              glAccountId: manualCustomerPayment.otherGLAccount,
              isReturn: false
            });

            if (customerInvoice.isReturn) {
              historyData.push({
                supplierId: req.user.supplierId,
                invoiceId: customerInvoice._id,
                paymentId: manualCustomerPayment._id,
                totalCost: customerInvoice.totalCost,
                tax: customerInvoice.tax,
                remainCost: newRemainCost,
                netAmount: customerInvoice.totalCost - customerInvoice.tax,
                date: dto.date,
                paymentStatus: customerInvoice.paymentStatus,
                docNumber: customerInvoice?.referenceCI?.docNumber,
                paidAmount: dto.amount,
                glAccountId: manualCustomerPayment.otherGLAccount,
                isReturn: true
              });
            }
          }
        }
      }

      if (historyData?.length > 0) {
        await this.payHistoryModel.insertMany(historyData);
        manualCustomerPayment.history = historyData;
        await manualCustomerPayment.save();
      }
    }
    return manualCustomerPayment;
  }

  async findAll(
    req: any,
    query: QueryManualCustomerPaymentDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ManualCustomerPaymentDocument>> {
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
    if (req.query.customerId) {
      queryToApply.customerId = req.query.customerId;
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

    const records = await this.manualCustomerPaymentModelPag.paginate(
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
    return records;
  }

  async findOne(
    manualCUstomerPaymentId: string,
    i18n: I18nContext,
  ): Promise<ManualCustomerPaymentDocument> {
    const exists = await this.manualCustomerPaymentModel
      .findById(manualCUstomerPaymentId)
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
          path: 'payFrom',
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
    manualCUstomerPaymentId: string,
    dto: UpdateManualCustomerPaymentDto,
    i18n: I18nContext,
  ): Promise<ManualCustomerPaymentDocument> {
    const manualCustomerPayment =
      await this.manualCustomerPaymentModel.findByIdAndUpdate(
        manualCUstomerPaymentId,
        dto,
        {
          new: true,
        },
      );

    if (!manualCustomerPayment) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return manualCustomerPayment;
  }

  async remove(
    manualCUstomerPaymentId: string,
    i18n: I18nContext,
  ): Promise<boolean> {
    const manualCustomerPayment =
      await this.manualCustomerPaymentModel.findByIdAndDelete(
        manualCUstomerPaymentId,
      );

    if (!manualCustomerPayment) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async updateApproval(req: any, Id: string): Promise<any> {

    const manualCustomerPayment: any = await this.manualCustomerPaymentModel.findById(Id);
    if (!manualCustomerPayment) {
      throw new NotFoundException();
    }

    await this.manualCustomerPaymentModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    const invoiceReceiptIds = manualCustomerPayment.invoices
      .filter((i) => i.type == RefInvoiceType.InvoiceReceipt)
      .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

    const customerInvoiceIds = manualCustomerPayment.invoices
      .filter((i) => i.type == RefInvoiceType.ManualCustomerInvoice)
      .map((i) => new mongoose.Types.ObjectId(i.invoiceId));

    let historyData = [];
    if (manualCustomerPayment) {
      await this.glVoucherHelperService.handleManualCustomerPayment(
        manualCustomerPayment,
      );

      if (manualCustomerPayment.invoices.length > 1) {
        if (customerInvoiceIds.length > 0) {
          await this.manualCustomerInvoiceModel.updateMany(
            { _id: { $in: customerInvoiceIds } },
            {
              $set: {
                paymentStatus: OrderPaymentStatus.Paid,
                remainCost: 0
              },
            },
          );

          const irviDatas = await this.manualCustomerInvoiceModel.find({ _id: { $in: customerInvoiceIds } });

          for (let i = 0; i < irviDatas.length; i++) {
            const el = irviDatas[i];
            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: el._id,
              paymentId: manualCustomerPayment._id,
              totalCost: el.totalCost,
              netAmount: el.totalCost - el.tax,
              tax: el.tax,
              remainCost: el.remainCost,
              date: manualCustomerPayment.date,
              paymentStatus: el.paymentStatus,
              docNumber: el.docNumber
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
        }
      } else {
        if (invoiceReceiptIds.length > 0) {
          const invoiceReceipt = await this.invoiceReceiptModel.findById(
            invoiceReceiptIds[0],
          );
          if (invoiceReceipt) {
            invoiceReceipt.paymentStatus =
              manualCustomerPayment.amount?.toFixed(2) >= invoiceReceipt.totalCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;

            await invoiceReceipt.save();
          }
        }
        if (customerInvoiceIds.length > 0) {
          const customerInvoice =
            await this.manualCustomerInvoiceModel.findById(
              customerInvoiceIds[0],
            );
          if (customerInvoice) {
            customerInvoice.paymentStatus =
              manualCustomerPayment.amount?.toFixed(2) >= customerInvoice.remainCost?.toFixed(2)
                ? OrderPaymentStatus.Paid
                : OrderPaymentStatus.PartiallyPaid;
            customerInvoice.remainCost = Math.abs(customerInvoice.remainCost - manualCustomerPayment.amount);
            await customerInvoice.save();


            historyData.push({
              supplierId: req.user.supplierId,
              invoiceId: customerInvoice._id,
              paymentId: manualCustomerPayment._id,
              totalCost: customerInvoice.totalCost,
              tax: customerInvoice.tax,
              remainCost: customerInvoice.remainCost,
              netAmount: customerInvoice.totalCost - customerInvoice.tax,
              date: manualCustomerPayment.date,
              paymentStatus: customerInvoice.paymentStatus,
              docNumber: customerInvoice.docNumber
            });
          }
        }
      }

      if (historyData?.length > 0) {
        manualCustomerPayment.history = historyData;
        await manualCustomerPayment.save();
      }
    }

    return true;
  }
}
