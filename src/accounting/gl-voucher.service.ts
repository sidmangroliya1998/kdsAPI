import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,

} from 'src/core/Constants/pagination';
import { AggregatePaginateModel } from 'mongoose';
import { AggregatePaginateResult } from 'mongoose';

import { GlVoucher, GlVoucherDocument } from './schemas/gl-voucher.schema';
import { CreateGlVoucherDto } from './dto/create-gl-voucher.dto';
import { UpdateGlAccountDto } from 'src/gl-account/dto/update-gl-account.dto';
import { UpdateGlVoucherDto } from './dto/update-gl-voucher.dto';
import { GLHistoryActionType, GLTransStatus, GlLineType, GlVoucherType } from './enum/en.enum';
import { BulkTransferDto } from './dto/bulk-transfer.dto';
import { GlVoucherHelperService } from './gl-voucher-helper.service';
import { Expense, ExpenseDocument } from 'src/expense/schemas/expense.schema';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';

import {
  Purchase,
  PurchaseDocument,
} from 'src/purchase/schemas/purchase.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { QueryGlVoucherDto } from './dto/query-gl-voucher.dto';
import * as moment from 'moment';
import { TrialBalanceReportDto } from './dto/trial-balance-report.dto';
import {
  GlAccount,
  GlAccountDocument,
} from 'src/gl-account/schemas/gl-account.schema';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptDocument,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import {
  WasteEvent,
  WasteEventDocument,
} from 'src/waste-event/schema/waste-event.schema';
import {
  InventoryTransfer,
  InventoryTransferDocument,
} from 'src/inventory/schemas/inventory-transfer.schema';
import {
  ProductionEvent,
  ProductionEventDocument,
} from 'src/production-event/schema/production-event.schema';
import {
  InventoryCount,
  InventoryCountDocument,
} from 'src/inventory-count/schema/inventory-count.schema';
import {
  ProfitDetail,
  ProfitDetailDocument,
} from 'src/profit-detail/schema/profit-detail.schema';
import {
  ManualVendorInvoice,
  ManualVendorInvoiceDocument,
} from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import {
  ManualVendorPayment,
  ManualVendorPaymentDocument,
} from 'src/manual-vendor-payment/schemas/manual-vendor-payment.schema';
import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceDocument,
} from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import {
  ManualCustomerPayment,
  ManualCustomerPaymentDocument,
} from 'src/manual-customer-payment/schemas/manual-customer-payment.schema';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { QueryGlBalanceDto } from './dto/query-gl-balance.dto';
import { GlAccountBalance, GlAccountBalanceDocument } from 'src/gl-account/schemas/gl-account-balance.schema';
import { GlTaxIndication, GlTaxIndicationDocument } from 'src/gl-tax-indication/schemas/gl-tax-indication.schema';
import { GlAccountMapping, GlAccountMappingDocument } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { GlVoucherHistory, GlVoucherHistoryDocument } from './schemas/gl-voucher-history.schema';
import { CreateGlVoucherHistoryDto } from './dto/create-gl-voucher-history.dto';
import { TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class GlVoucherService {
  constructor(
    @InjectModel(GlVoucher.name)
    private readonly glVoucherModel: Model<GlVoucherDocument>,
    @InjectModel(GlAccount.name)
    private readonly glAccountModel: Model<GlAccountDocument>,
    @InjectModel(GlVoucher.name)
    private readonly glVoucherModelPag: PaginateModel<GlVoucherDocument>,
    @InjectModel(GlVoucher.name)
    private readonly glVoucherModelAggPag: AggregatePaginateModel<GlVoucherDocument>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<PurchaseDocument>,
    @InjectModel(GoodsReceipt.name)
    private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
    @InjectModel(WasteEvent.name)
    private readonly wasteEventModel: Model<WasteEventDocument>,
    @InjectModel(InventoryTransfer.name)
    private readonly inventoryTransferModel: Model<InventoryTransferDocument>,
    @InjectModel(ProductionEvent.name)
    private readonly productionEventModel: Model<ProductionEventDocument>,
    @InjectModel(InventoryCount.name)
    private readonly inventoryCountEventModel: Model<InventoryCountDocument>,
    @InjectModel(ProfitDetail.name)
    private readonly profitDetailEventModel: Model<ProfitDetailDocument>,
    @InjectModel(ManualVendorInvoice.name)
    private readonly manualVendorInvoiceEventModel: Model<ManualVendorInvoiceDocument>,
    @InjectModel(ManualVendorPayment.name)
    private readonly manualVendorPaymentEventModel: Model<ManualVendorPaymentDocument>,
    @InjectModel(ManualCustomerInvoice.name)
    private readonly manualCustomerInvoiceEventModel: Model<ManualCustomerInvoiceDocument>,
    @InjectModel(ManualCustomerPayment.name)
    private readonly manualCustomerPaymentEventModel: Model<ManualCustomerPaymentDocument>,
    @Inject(forwardRef(() => GlVoucherHelperService))
    private readonly glVoucherHelperService: GlVoucherHelperService,

    @InjectModel(GlAccountBalance.name)
    private readonly glAccBalanceModel: Model<GlAccountBalanceDocument>,

    @InjectModel(GlTaxIndication.name)
    private readonly glTaxIndicationModel: Model<GlTaxIndicationDocument>,
    @InjectModel(GlAccountMapping.name)
    private readonly glAccountMappingModel: Model<GlAccountMappingDocument>,
    @InjectModel(GlVoucherHistory.name)
    private readonly glVoucherHistoryModel: Model<GlVoucherHistoryDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(req: any, dto: CreateGlVoucherDto): Promise<GlVoucherDocument> {
    const filteredItems = dto.items.filter((item) => item.amount > 0);

    dto = { ...dto, items: filteredItems };

    const credit = dto.items.reduce((acc, o) => {
      if (o.glLineType == GlLineType.CR) return acc + o.amount;
      return acc;
    }, 0);
    const debit = dto.items.reduce((acc, o) => {
      if (o.glLineType == GlLineType.DR) return acc + o.amount;
      return acc;
    }, 0);

    if (roundOffNumber(credit, 2) == 0 || roundOffNumber(debit, 2) == 0) {
      throw new BadRequestException('Credit and Debit should be greater than zero');
    }
    if (roundOffNumber(credit, 2) != roundOffNumber(debit, 2)) {
      throw new BadRequestException('Credit and Debit amount must match');
    }
    if (filteredItems.find((f: any) => f.glTaxIndicationId && f.glTaxIndicationId != null &&
      f.glTaxIndicationId != '')) {

      let newFilteredItems = []
      for (let i = 0; i < filteredItems.length; i++) {
        const el = filteredItems[i];
        if (el.glTaxIndicationId && el.glTaxIndicationId != null &&
          el.glTaxIndicationId != '') {

          const taxRate = await this.glTaxIndicationModel.findById(el.glTaxIndicationId);

          if (taxRate.rate > 0) {

            const mapping = await this.glAccountMappingModel.findOne({
              supplierId: req.user.supplierId,
            });
            const glAccId = await this.glVoucherHelperService.findGlAccount(mapping, el.glTaxIndicationId, "glTaxIndicationCode");
            if (glAccId && glAccId?.glAccount && glAccId?.glAccount != '') {
              const newAmount = (el.amount / (1 + taxRate.rate / 100));
              const taxAmount = (newAmount * taxRate.rate) / 100;
              el.amount = newAmount;
              newFilteredItems.push(el);

              newFilteredItems.push({
                ...el,
                glAccountId: glAccId?.glAccount?.toString(),
                amount: taxAmount
              });
            }
            else {
              newFilteredItems.push(el);
            }
          }
          else {
            newFilteredItems.push(el);
          }
        } else {
          newFilteredItems.push(el);
        }
      }

      dto = { ...dto, items: newFilteredItems };
    }

    const groupedTempItem = dto.items.reduce((result, item) => {
      const key = `${item.glAccountId}_${item.glLineType}`;
      if (!result[key]) {
        result[key] = { ...item, amount: 0 };
      }
      result[key].amount += item.amount;
      return result;
    }, {} as Record<string, any>);

    // Converting the grouped object back to an array
    const groupedArray: any = Object.values(groupedTempItem);


    const newFilteredItems = groupedArray.map(elx => ({
      glAccountId: elx.glAccountId,
      glLineType: elx.glLineType,
      amount: elx.amount,
      description: elx.description,
      ...elx
    }));

    dto = { ...dto, items: newFilteredItems }
    const glVoucher = await this.glVoucherModel.findOne(
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
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    if (glVoucher) {
      const arr = glVoucher.voucherNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
      console.log(arr, counter);
    }
    dto.date.setUTCHours(0);
    dto.date.setUTCMinutes(0);
    dto.date = new Date(dto.date.toLocaleString('en', { timeZone: TIMEZONE }));

    if (dto.transStatus && dto.transStatus == GLTransStatus.Approved) {
      await this.updateGLAccountBalance(filteredItems);
    }

    const voucherData = await this.glVoucherModel.create({
      ...dto,
      voucherNumber: postFix + String(counter).padStart(5, '0'),
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      period: dto.date.getMonth() + 1,
      year: dto.date.getFullYear(),
    });

    if (voucherData) {
      await this.glVoucherHistoryModel.create({
        glVoucherId: voucherData._id,
        type: dto.type == GlVoucherType.Manual ? GLHistoryActionType.ManualEntry : GLHistoryActionType.AutoEntry,
        description: dto.description,
        addedBy: req.user.userId,
        updatedBy: req.user.userId,
        isSystemGenerated: dto.type == GlVoucherType.Manual ? false : true
      });
    }
    return voucherData;
  }

  async findAll(
    req: any,
    query: QueryGlVoucherDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlVoucherDocument>> {
    let queryToApply: any = {};

    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);
      // query.startDate = new Date(
      //   query.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      // );
      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(59);
      // query.endDate = new Date(
      //   query.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      // );
      queryToApply.date = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }
    if (query.voucherNumber) {
      queryToApply.voucherNumber = query.voucherNumber;
    }
    if (query.documentType) {
      queryToApply.type = query.documentType;
    }
    if (query.description) {
      queryToApply.description = { $regex: new RegExp(query.description, 'i') };
    }
    if (query.costCenter) {
      queryToApply.items = { $elemMatch: { costCenter: query.costCenter } };
    }
    if (query.segment) {
      queryToApply.items = { $elemMatch: { segment: query.segment } };
    }
    if (query.purpose) {
      queryToApply.items = { $elemMatch: { purpose: query.purpose } };
    }
    // if ((query.minAmount && query.minAmount > 0)
    //   || (query.maxAmount && query.maxAmount > 0)) {
    //   const amountRangeQuery: any = {};

    //   if (query.minAmount) {
    //     amountRangeQuery.$gt = query.minAmount;
    //   }

    //   if (query.maxAmount) {
    //     amountRangeQuery.$lt = query.maxAmount;
    //   }
    //   queryToApply['items.amount'] = amountRangeQuery;
    // }

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

    const glVouchers = await this.glVoucherModelPag.paginate(
      { supplierId: req.user.supplierId, ...queryToApply },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'items.glAccountId',
            select: {
              name: 1,
              nameAr: 1,
              glNumber: 1,
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
            path: 'addedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
        ],
      },
    );


    //     const aggregationPipeline: any = [];

    // // Apply the range query only if minAmount or maxAmount is provided and greater than 0
    //     if ((query.minAmount && query.minAmount > 0) || (query.maxAmount && query.maxAmount > 0)) {
    //       const amountRangeQuery: any = {};

    //       if (query.minAmount) {
    //         amountRangeQuery.$gt = query.minAmount;
    //       }

    //       if (query.maxAmount) {
    //         amountRangeQuery.$lt = query.maxAmount;
    //       }

    //       aggregationPipeline.push(
    //         {
    //           $match: { supplierId: req.user.supplierId, ...queryToApply },
    //         },
    //         {
    //           $unwind: '$items',
    //         },
    //         {
    //           $match: { 'items.glLineType': 'DR' },
    //         },
    //         {
    //           $group: {
    //             _id: '$_id',
    //             items: { $push: '$items' },
    //             sumAmount: { $sum: '$items.amount' },
    //           },
    //         },
    //         {
    //           $match: {
    //             sumAmount: amountRangeQuery,
    //           },
    //         },
    //         {
    //           $project: {
    //             items: 1,
    //             sumAmount: 1,
    //           },
    //         })
    //     }

    //     else {
    //       aggregationPipeline.push(
    //         {
    //           $match: { supplierId: req.user.supplierId },
    //         },
    //       )
    //     }
    //     console.log("aggregationPipeline", aggregationPipeline);

    //     const glVouchers = await this.glVoucherModelPag.aggregatePaginate(
    //       this.glVoucherModel.aggregate(aggregationPipeline),
    //       {
    //         sort: DefaultSort,
    //         lean: true,
    //         ...paginateOptions,
    //         ...pagination,
    //       },
    //     );


    return glVouchers;
  }

  async findOne(glVoucherId: string): Promise<GlVoucherDocument> {
    const exists = await this.glVoucherModel.findById(glVoucherId).populate([
      {
        path: 'items.glAccountId',
        select: {
          name: 1,
          nameAr: 1,
          glNumber: 1,
        },
      },
    ]);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    req: any,
    glVoucherId: string,
    dto: UpdateGlVoucherDto,
  ): Promise<GlVoucherDocument> {
    if (dto.items && dto.items?.length > 0) {
      const filteredItems = dto.items.filter((item) => item.amount > 0);

      dto = { ...dto, items: filteredItems };
      if (filteredItems.find((f: any) => f.glTaxIndicationId && f.glTaxIndicationId != null &&
        f.glTaxIndicationId != '')) {

        let newFilteredItems = []
        for (let i = 0; i < filteredItems.length; i++) {
          const el = filteredItems[i];
          if (el.glTaxIndicationId && el.glTaxIndicationId != null &&
            el.glTaxIndicationId != '') {

            const taxRate = await this.glTaxIndicationModel.findById(el.glTaxIndicationId);

            if (taxRate.rate > 0) {

              const mapping = await this.glAccountMappingModel.findOne({
                supplierId: req.user.supplierId,
              });
              const glAccId = await this.glVoucherHelperService.findGlAccount(mapping, el.glTaxIndicationId, "glTaxIndicationCode");
              if (glAccId && glAccId?.glAccount && glAccId?.glAccount != '') {
                const newAmount = (el.amount / (1 + taxRate.rate / 100));
                const taxAmount = (newAmount * taxRate.rate) / 100;
                el.amount = newAmount;
                newFilteredItems.push(el);

                newFilteredItems.push({
                  ...el,
                  glAccountId: glAccId?.glAccount?.toString(),
                  amount: taxAmount
                });
              }
              else {
                newFilteredItems.push(el);
              }
            }
            else {
              newFilteredItems.push(el);
            }
          } else {
            newFilteredItems.push(el);
          }
        }
        dto = { ...dto, items: newFilteredItems };
      }
      const credit = dto.items.reduce((acc, o) => {
        if (o.glLineType == GlLineType.CR) return acc + o.amount;
        return acc;
      }, 0);
      const debit = dto.items.reduce((acc, o) => {
        if (o.glLineType == GlLineType.DR) return acc + o.amount;
        return acc;
      }, 0);

      if (roundOffNumber(credit, 2) != roundOffNumber(debit, 2)) {
        throw new BadRequestException('Credit and Debit amount must match');
      }

      if (dto.transStatus && dto.transStatus == GLTransStatus.Approved) {
        await this.updateGLAccountBalance(filteredItems);
      }
    }
    const glVoucher = await this.glVoucherModel.findByIdAndUpdate(
      glVoucherId,
      dto,
      {
        new: true,
      },
    );

    if (!glVoucher) {
      throw new NotFoundException();
    }
    await this.glVoucherHistoryModel.create({
      glVoucherId: glVoucher._id,
      type: GLHistoryActionType.UpdateEntry,
      description: dto.description,
      addedBy: req.user.userId,
      updatedBy: req.user.userId,
      isSystemGenerated: dto.type == GlVoucherType.Manual ? false : true
    });
    return glVoucher;
  }

  async updateApproval(req: any,
    glVoucherId: string,) {
    const glVoucher = await this.glVoucherModel.findByIdAndUpdate(
      glVoucherId,
      {
        transStatus: GLTransStatus.Approved
      },
      {
        new: true,
      },
    );

    if (!glVoucher) {
      throw new NotFoundException();
    }
    await this.glVoucherHistoryModel.create({
      glVoucherId: glVoucher._id,
      type: GLHistoryActionType.ManualApproved,
      description: 'Approved',
      addedBy: req.user.userId,
      updatedBy: req.user.userId,
      isSystemGenerated: true
    });
  }

  async updateHistoryNotes(req: any, dto: CreateGlVoucherHistoryDto) {
    const glVoucher = await this.glVoucherHistoryModel.findByIdAndUpdate(
      dto.voucherHistoryId,
      {
        description: dto.notes,
        updatedBy: req.user.userId,
      },
      {
        new: true,
      },
    );
    glVoucher
  }

  async createHistoryNotes(req: any, dto: CreateGlVoucherHistoryDto) {
    await this.glVoucherHistoryModel.create({
      glVoucherId: dto.voucherId,
      type: GLHistoryActionType.AddNotes,
      description: dto.notes,
      addedBy: req.user.userId,
      updatedBy: req.user.userId,
      isSystemGenerated: false
    });
    return true;
  }

  async getVoucherHistory(glVoucherId) {
    const exists = await this.glVoucherHistoryModel.find({ glVoucherId: glVoucherId })
      .populate({
        path: 'addedBy',
        select: {
          name: 1,
          _id: 1,
        },
      })
      .populate({
        path: 'updatedBy',
        select: {
          name: 1,
          _id: 1,
        },
      });


    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async reverse(req, glVoucherId: string) {
    const glVoucher = await this.glVoucherModel.findById(glVoucherId);

    if (!glVoucher) {
      throw new NotFoundException();
    }

    if (glVoucher.isReversed) {
      throw new NotFoundException('Already reversed');
    }

    const dto: CreateGlVoucherDto = {
      restaurantId: glVoucher.restaurantId.toString(),
      referenceNumber: glVoucher.referenceNumber,
      type: GlVoucherType.ManualJEReversal,
      date: new Date(),
      items: [],
      reversedVoucherId: glVoucherId,
    };

    glVoucher.items.forEach((gi: any) => {
      const tmp = gi.toObject();
      if (tmp.glLineType == GlLineType.CR) tmp.glLineType = GlLineType.DR;
      else if (tmp.glLineType == GlLineType.DR) tmp.glLineType = GlLineType.CR;

      delete tmp._id;
      dto.items.push({ ...tmp });
    });

    const reversedDoc = await this.create(req, dto);
    if (reversedDoc) {
      glVoucher.isReversed = true;
      glVoucher.reverseId = reversedDoc._id;
      glVoucher.save();
    }
    return reversedDoc;
  }

  async trialBalance(req, query: TrialBalanceReportDto) {
    let prevBalance = null;
    if (query.periodStart && query.periodStart > 0) {
      prevBalance = await this.glVoucherModel.aggregate([
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            period: { $lt: query.periodStart },
            year: query.year,
          },
        },
        {
          $unwind: '$items',
        },
        {
          $group: {
            _id: '$items.glAccountId',
            credit: {
              $sum: {
                $cond: [
                  { $eq: ['$items.glLineType', GlLineType.CR] },
                  '$items.amount',
                  0,
                ],
              },
            },
            debit: {
              $sum: {
                $cond: [
                  { $eq: ['$items.glLineType', GlLineType.DR] },
                  '$items.amount',
                  0,
                ],
              },
            },
          },
        },
      ]);
    }
    let periodQuery = {};
    if (query.periodStart && query.periodEnd) {
      periodQuery = {
        period: {
          $gte: query.periodStart,
          $lte: query.periodEnd,
        },
      };
    }
    const glAccountVouchers = await this.glVoucherModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...periodQuery,
          year: query.year,
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.glAccountId',
          credit: {
            $sum: {
              $cond: [
                { $eq: ['$items.glLineType', GlLineType.CR] },
                '$items.amount',
                0,
              ],
            },
          },
          debit: {
            $sum: {
              $cond: [
                { $eq: ['$items.glLineType', GlLineType.DR] },
                '$items.amount',
                0,
              ],
            },
          },
        },
      },
    ]);
    console.log(glAccountVouchers);
    const glAccounts = await this.glAccountModel.find({
      supplierId: req.user.supplierId,
    });
    const response: any[] = [
      {
        openingBalancePeriod:
          query.periodStart && query.periodStart > 1
            ? '1-' + (query.periodStart - 1)
            : '0-0',
        reportingPeriod:
          query.periodStart && query.periodEnd
            ? query.periodStart + '-' + query.periodEnd
            : '1-12',
        reportingTime: new Date(),
      },
    ];
    for (const i in glAccounts) {
      let tempPrevBalance = 0;
      if (prevBalance && prevBalance.length > 0) {
        const normalisedPreBal = prevBalance.find(
          (p) => p._id.toString() == glAccounts[i]._id.toString(),
        );
        if (normalisedPreBal) {
          tempPrevBalance = normalisedPreBal.debit - normalisedPreBal.credit;
        }
      }
      const glVoucher = glAccountVouchers.find(
        (g) => g._id.toString() == glAccounts[i]._id.toString(),
      );
      response.push({
        glAccount: glAccounts[i],
        prevBalance: tempPrevBalance,
        credit: glVoucher ? glVoucher.credit : 0,
        debit: glVoucher ? glVoucher.debit : 0,
        accumulated: glVoucher
          ? tempPrevBalance + glVoucher.debit - glVoucher.credit
          : tempPrevBalance,
      });
    }
    return response;
  }

  async transfer(req, dto: BulkTransferDto) {
    if (dto.type == GlVoucherType.Expense) {
      this.transferExpenses(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.Sales) {
      this.transferSales(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.Purchase) {
      this.transferPurchases(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.GoodsReceipt) {
      this.transferGoogleReceipts(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.InvoiceReceipt) {
      this.transferInvoiceReceipts(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.WasteEvent) {
      this.transferWasteEvents(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.StockTransfer) {
      this.transferStockTransfer(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.RecipeProduction) {
      this.transferRecipeProduction(req, dto.objectIds);
    }
    // else if (dto.type == GlVoucherType.SalesGoodsIssue) {
    //   this.transferSalesGoods(req, dto.objectIds,dto.prepareDatas);
    // }
    else if (dto.type == GlVoucherType.ManualVendorInvoice) {
      this.transferManualVendorInvoice(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.ManualVendorPayment) {
      this.transferManualVendorPayment(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.ManualCustomerInvoice) {
      this.transferManualCustomerInvoice(req, dto.objectIds);
    } else if (dto.type == GlVoucherType.ManualCustomerPayment) {
      this.transferManualCustomerPayment(req, dto.objectIds);
    }
    return 'Started';
  }

  async transferExpenses(req, objectIds: string[]) {
    const expenses = await this.expenseModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in expenses) {
      if (!expenses[i].trasferredToGl) {
        this.glVoucherHelperService.handleExpense(expenses[i]);
      }
    }
  }

  async transferSales(req, objectIds: string[]) {
    const sales = await this.orderModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }, { path: 'restaurantId' }]);
    for (const i in sales) {
      if (!sales[i].trasferredToGl) {
        this.glVoucherHelperService.handleSale(sales[i]);
      }
    }
  }

  async transferPurchases(req, objectIds: string[]) {
    const purchases = await this.purchaseModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in purchases) {
      if (!purchases[i].trasferredToGl) {
        this.glVoucherHelperService.handlePurchase(purchases[i]);
      }
    }
  }

  async transferGoogleReceipts(req, objectIds: string[]) {
    const googleReceipts = await this.goodsReceiptModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in googleReceipts) {
      if (!googleReceipts[i].trasferredToGl) {
        this.glVoucherHelperService.handleGoodsReceipt(googleReceipts[i]);
      }
    }
  }

  async transferInvoiceReceipts(req, objectIds: string[]) {
    const invoiceReceipts = await this.invoiceReceiptModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in invoiceReceipts) {
      if (!invoiceReceipts[i].trasferredToGl) {
        this.glVoucherHelperService.handleInvoiceReceipt(invoiceReceipts[i]);
      }
    }
  }

  async transferWasteEvents(req, objectIds: string[]) {
    const wasteEvents = await this.wasteEventModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in wasteEvents) {
      if (!wasteEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleWasteEvent(wasteEvents[i]);
      }
    }
  }

  async transferStockTransfer(req, objectIds: string[]) {
    const inventoryTransfers = await this.inventoryTransferModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in inventoryTransfers) {
      if (!inventoryTransfers[i].trasferredToGl) {
        this.glVoucherHelperService.handleStockTransfer(inventoryTransfers[i]);
      }
    }
  }

  async transferRecipeProduction(req, objectIds: string[]) {
    const productionEvents = await this.productionEventModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in productionEvents) {
      if (!productionEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleRecipeProduction(productionEvents[i]);
      }
    }
  }

  async transferInventoryCount(req, objectIds: string[]) {
    const inventoryCountEvents = await this.inventoryCountEventModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in inventoryCountEvents) {
      if (!inventoryCountEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleInventoryCount(
          inventoryCountEvents[i],
        );
      }
    }
  }

  async transferSalesGoods(req, objectIds: string[], prepareData: any[]) {
    // const profitDetailEvents = await this.profitDetailEventModel
    //   .find({ _id: { $in: objectIds } })
    //   .populate([{ path: 'supplierId' }]);
    // for (const i in profitDetailEvents) {
    //   if (!profitDetailEvents[i].trasferredToGl) {
    //     this.glVoucherHelperService.handleSalesGoods(profitDetailEvents[i],prepareData);
    //   }
    // }
  }

  async transferManualVendorInvoice(req, objectIds: string[]) {
    const manualVenderInvoiceEvents = await this.manualVendorInvoiceEventModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in manualVenderInvoiceEvents) {
      if (!manualVenderInvoiceEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleManualVendorInvoice(
          manualVenderInvoiceEvents[i],
        );
      }
    }
  }

  async transferManualVendorPayment(req, objectIds: string[]) {
    const manualVendorPaymentEvents = await this.manualVendorPaymentEventModel
      .find({ _id: { $in: objectIds } })
      .populate([{ path: 'supplierId' }]);
    for (const i in manualVendorPaymentEvents) {
      if (!manualVendorPaymentEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleManualVendorPayment(
          manualVendorPaymentEvents[i],
        );
      }
    }
  }

  async transferManualCustomerInvoice(req, objectIds: string[]) {
    const manualCustomerInvoiceEvents =
      await this.manualCustomerInvoiceEventModel
        .find({ _id: { $in: objectIds } })
        .populate([{ path: 'supplierId' }]);
    for (const i in manualCustomerInvoiceEvents) {
      if (!manualCustomerInvoiceEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleManualCustomerInvoice(
          manualCustomerInvoiceEvents[i],
        );
      }
    }
  }

  async transferManualCustomerPayment(req, objectIds: string[]) {
    const manualVendorCustomerPaymentEvents =
      await this.manualCustomerPaymentEventModel
        .find({ _id: { $in: objectIds } })
        .populate([{ path: 'supplierId' }]);
    for (const i in manualVendorCustomerPaymentEvents) {
      if (!manualVendorCustomerPaymentEvents[i].trasferredToGl) {
        this.glVoucherHelperService.handleManualCustomerPayment(
          manualVendorCustomerPaymentEvents[i],
        );
      }
    }
  }

  async remove(glVoucherId: string): Promise<boolean> {
    const glVoucher = await this.glVoucherModel.findByIdAndRemove(glVoucherId);

    if (!glVoucher) {
      throw new NotFoundException();
    }
    return true;
  }

  async glAccountBalanceReport(req: any, query: QueryGlBalanceDto,
    paginateOptions: PaginationDto): Promise<any> {
    const queryToApply: any = {};

    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);

      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(59);

      queryToApply.date = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }

    const openingBalanceQuery = [
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          date: { $lt: new Date(query.startDate) },
          'items.glAccountId': new mongoose.Types.ObjectId(query.glAccountId),
        }
      },
      {
        $unwind: "$items"
      },
      {
        $match: {
          'items.glAccountId': new mongoose.Types.ObjectId(query.glAccountId)
        }
      },
      {
        $group: {
          _id: null,
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ["$items.glLineType", "DR"] }, "$items.amount", 0]
            }
          },
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ["$items.glLineType", "CR"] }, "$items.amount", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          openingBalance: { $subtract: ["$totalDebit", "$totalCredit"] }
        }
      }
    ];

    const openingBalanceResult = await this.glVoucherModel.aggregate(openingBalanceQuery);
    const openingBalance = openingBalanceResult.length > 0 ? openingBalanceResult[0].openingBalance : 0;

    const glAccountVouchers = await this.glVoucherModelAggPag.aggregatePaginate(
      this.glVoucherModelAggPag.aggregate(
        [
          {
            $match: {
              supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
              'items.glAccountId': new mongoose.Types.ObjectId(query.glAccountId),
              ...queryToApply
            }
          },
          {
            $unwind: "$items"
          },
          {
            $match: {
              'items.glAccountId': new mongoose.Types.ObjectId(query.glAccountId)
            }
          },
          {
            $group: {
              _id: {
                date: {
                  $dateToString: { format: "%Y-%m-%d", date: "$date" }
                },
                type: "$type",
                description: "$description",
                referenceDocNumber: "$referenceDocNumber",
                voucherNumber: "$voucherNumber",
                glLineType: "$items.glLineType",
              },
              totalAmount: {
                $sum: "$items.amount"
              }
            }
          },
          {
            $project: {
              _id: 0,
              date: "$_id.date",
              type: "$_id.type",
              description: "$_id.description",
              referenceDocNumber: "$_id.referenceDocNumber",
              voucherNumber: "$_id.voucherNumber",
              glLineType: "$_id.glLineType",
              amount: "$totalAmount"
            }
          },
          {
            $sort: {
              date: 1
            }
          }
        ]
      ),
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      });

    // console.log("glAccountVouchers", glAccountVouchers)
    let newVouchersArray = [];
    let currentBalance = openingBalance; // Initialize with the opening balance
    let totalDebit = 0;
    let totalCredit = 0;

    if (glAccountVouchers && glAccountVouchers?.docs && glAccountVouchers?.docs?.length > 0) {
      glAccountVouchers?.docs?.forEach(item => {
        if (item.glLineType === "DR") {
          currentBalance += item.amount;
          totalDebit += item.amount; // Sum the debit amount
        } else if (item.glLineType === "CR") {
          currentBalance -= item.amount;
          totalCredit += item.amount; // Sum the credit amount
        }

        let newItem = { ...item, balance: currentBalance };
        newVouchersArray.push(newItem);
      });
    }


    const response = {
      openingBal: openingBalance,
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      closingBalance: currentBalance,
      respData: newVouchersArray,
      netMovement: totalDebit - totalCredit,
      totalDocs: glAccountVouchers?.totalDocs,
      limit: glAccountVouchers?.limit,
      page: glAccountVouchers?.page,
      totalPages: glAccountVouchers?.totalPages,
      pagingCounter: glAccountVouchers?.pagingCounter,
      hasPrevPage: glAccountVouchers?.hasPrevPage,
      hasNextPage: glAccountVouchers?.hasNextPage,
      prevPage: glAccountVouchers?.prevPage,
      nextPage: glAccountVouchers?.nextPage
    }
    return response;
  }


  async setupGLAccountBalance(req: any) {

    const accountBalanceData: any = await this.glVoucherModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId)
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.glAccountId",
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ["$items.glLineType", "DR"] }, "$items.amount", 0]
            }
          },
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ["$items.glLineType", "CR"] }, "$items.amount", 0]
            }
          }
        }
      }
    ]);

    await this.glAccBalanceModel.deleteMany(
      {
        supplierId: new mongoose.Types.ObjectId(req.user.supplierId)
      });

    const transformedDataArray = await accountBalanceData.map(item => ({
      supplierId: req.user.supplierId,
      glAccountId: item._id,
      totalDebit: item.totalDebit,
      totalCredit: item.totalCredit,
      totalBalance: item.totalDebit - item.totalCredit
    }));

    const allAccounts = await this.glAccountModel.find({
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId)
    });

    const existingAccountIds = transformedDataArray.map(el => el.glAccountId?.toString());

    const missingAccounts = allAccounts
      .filter(el => !existingAccountIds.includes(el._id?.toString()))
      .map(el => ({
        supplierId: req.user.supplierId,
        glAccountId: el._id,
        totalDebit: 0,
        totalCredit: 0,
        totalBalance: 0
      }));

    const resultArray = [...transformedDataArray, ...missingAccounts];
    await this.glAccBalanceModel.insertMany(resultArray);

    return resultArray;
  }

  async getAllGLAccountBalance(req: any) {

    const respAccBal = await this.glAccBalanceModel.find(
      {
        supplierId: new mongoose.Types.ObjectId(req.user.supplierId)
      }).populate([
        {
          path: 'glAccountId',
          select: {
            _id: 1,
            name: 1,
            nameAr: 1,
            glNumber: 1
          }
        }
      ]);

    let response = [];
    for (let i = 0; i < respAccBal.length; i++) {
      const el = respAccBal[i];
      response.push({
        glAccountId: el?.glAccountId?._id,
        glNumber: Number(el?.glAccountId?.glNumber) || 0,
        name: el?.glAccountId?.name,
        nameAr: el?.glAccountId?.nameAr,
        totalCredit: el?.totalCredit,
        totalDebit: el?.totalDebit,
        totalBalance: el?.totalBalance
      });
    }
    response = response.sort((a, b) => a.glNumber - b.glNumber);

    return response;
  }

  async updateGLAccountBalance(glAccountItems: any) {

    try {
      for (let i = 0; i < glAccountItems.length; i++) {
        const el = glAccountItems[i];

        const existingData = await this.glAccBalanceModel.find({
          glAccountId: el.glAccountId
        });

        const newCredit = Number(existingData[0]['totalCredit']) +
          (el.glLineType == 'CR' ? Number(el.amount) : 0);
        const newDebit = Number(existingData[0]['totalDebit']) +
          (el.glLineType == 'DR' ? Number(el.amount) : 0);

        await this.glAccBalanceModel.findByIdAndUpdate(existingData[0]["_id"],
          {
            totalCredit: newCredit,
            totalDebit: newDebit,
            totalBalance: newDebit - newCredit
          });
      }
    } catch (error) {
      console.log("error in balance update", error);
    }


  }

  async createScript() {
    await this.glVoucherModel.updateMany({}, { $set: { transStatus: GLTransStatus.Approved } });
  }

}
