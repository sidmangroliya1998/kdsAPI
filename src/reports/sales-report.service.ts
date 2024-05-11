import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import {
  CategorySalesTrendReport,
  ItemSalesTrendReport,
  SalesReportDto,
  SalesTrendReportDailyDto,
} from './dto/sales-report.dto';
import {
  Transaction,
  TransactionDocument,
} from 'src/transaction/schemas/transactions.schema';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { OrderPaymentStatus, OrderStatus } from 'src/order/enum/en.enum';
import { PaymentStatus } from 'src/core/Constants/enum';
import * as moment from 'moment';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import {
  Supplier,
  SupplierDocument,
} from '../supplier/schemas/suppliers.schema';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptDocument,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';

@Injectable()
export class SalesReportService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,

    @InjectModel(GoodsReceipt.name)
    private readonly grModel: Model<GoodsReceiptDocument>,

    @InjectModel(InvoiceReceipt.name)
    private readonly irModel: Model<InvoiceReceiptDocument>,

    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) { }

  async salesSummary(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const order = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: OrderPaymentStatus.Paid,
        },
      },
      {
        $lookup: {
          from: 'profitdetails',
          localField: '_id',
          foreignField: 'orderId',
          as: 'profitDetail',
        },
      },
      {
        $unwind: { path: '$profitDetail', preserveNullAndEmptyArrays: true },
      },
      // {
      //   $lookup: {
      //     from: 'transactions',
      //     let: {
      //       transactions: '$transactions',
      //     },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $in: ['$_id', '$$transactions'],
      //           },
      //           status: PaymentStatus.Success,
      //         },
      //       },
      //       {
      //         $project: {
      //           total: '$amount',
      //           cash: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Cash] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           card: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Card] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           hungerStation: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.HungerStation] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           jahez: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Jahez] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           toyo: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Toyo] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //         },
      //       },
      //       {
      //         $group: {
      //           _id: null,
      //           totalPayment: { $sum: '$total' },
      //           cash: { $sum: '$cash' },
      //           card: { $sum: '$card' },
      //           hungerStation: { $sum: '$hungerStation' },
      //           jahez: { $sum: '$jahez' },
      //           toyo: { $sum: '$toyo' },
      //         },
      //       },
      //     ],
      //     as: 'transactions',
      //   },
      // },
      // {
      //   $project: {
      //     transactions: { $first: '$transactions' },
      //     summary: 1,
      //     tip: 1,
      //   },
      // },
      {
        $group: {
          _id: {
            orderType: '$orderType',
            source: '$source',
            marketPlaceType: '$marketPlaceType',
          },
          grossSales: { $sum: '$summary.totalWithTax' },
          avgOrderValue: { $avg: '$summary.totalWithTax' },
          orderCount: { $sum: 1 },
          totalCost: { $sum: '$profitDetail.totalCost' },
          profit: { $sum: '$profitDetail.profit' },
        },
      },
    ]);
    let aggregate = {
      grossSales: 0,
      avgOrderValue: 0,
      orderCount: 0,
      totalCost: 0,
      profit: 0,
    };
    order.forEach((o) => {
      aggregate.grossSales += o.grossSales;
      aggregate.avgOrderValue += o.avgOrderValue;
      aggregate.orderCount += o.orderCount;
      aggregate.totalCost += o.totalCost;
      aggregate.profit += o.profit;
    });

    order.push(aggregate);

    return order;
  }
  async salesSummaryHourlyData(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const order = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: OrderPaymentStatus.Paid,
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
        },
      },
      // {
      //   $lookup: {
      //     from: 'transactions',
      //     let: {
      //       transactions: '$transactions',
      //     },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $in: ['$_id', '$$transactions'],
      //           },
      //           status: PaymentStatus.Success,
      //         },
      //       },
      //       {
      //         $project: {
      //           total: '$amount',
      //           cash: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Cash] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           card: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Card] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           // hungerStation: {
      //           //   $cond: [
      //           //     { $eq: ['$paymentMethod', PaymentMethod.HungerStation] },
      //           //     '$amount',
      //           //     0,
      //           //   ],
      //           // },
      //           // jahez: {
      //           //   $cond: [
      //           //     { $eq: ['$paymentMethod', PaymentMethod.Jahez] },
      //           //     '$amount',
      //           //     0,
      //           //   ],
      //           // },
      //           // toyo: {
      //           //   $cond: [
      //           //     { $eq: ['$paymentMethod', PaymentMethod.Toyo] },
      //           //     '$amount',
      //           //     0,
      //           //   ],
      //           // },
      //         },
      //       },
      //       {
      //         $group: {
      //           _id: null,
      //           totalPayment: { $sum: '$total' },
      //           cash: { $sum: '$cash' },
      //           card: { $sum: '$card' },
      //           // hungerStation: { $sum: '$hungerStation' },
      //           // jahez: { $sum: '$jahez' },
      //           // toyo: { $sum: '$toyo' },
      //         },
      //       },
      //     ],
      //     as: 'transactions',
      //   },
      // },
      {
        $project: {
          summary: 1,

          dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone } },
          // y: { $year: { date: '$createdAt', timezone } },
          // m: { $month: { date: '$createdAt', timezone } },
          // d: { $dayOfMonth: { date: '$createdAt', timezone } },
          h: { $hour: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: '$dayOfWeek',
            // month: '$m',
            // day: '$d',
            hour: '$h',
          },
          grossSales: { $sum: '$summary.totalBeforeDiscount' },
          // discounts: { $sum: '$summary.discount' },
          // netSales: { $sum: '$summary.totalTaxableAmount' },
          // tax: {
          //   $sum: '$summary.totalTax',
          // },
          // tip: {
          //   $sum: '$tip',
          // },
          // refunds: { $sum: '$summary.totalRefunded' },
          totalSales: { $sum: '$summary.totalWithTax' },

          orderCount: { $sum: 1 },
          // hungerStation: { $sum: '$transactions.hungerStation' },
          // jahez: { $sum: '$transactions.jahez' },
          // toyo: { $sum: '$transactions.toyo' },
        },
      },
    ]);

    const transactions = await this.transactionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          status: PaymentStatus.Success,
        },
      },
      {
        $project: {
          total: '$amount',
          cash: {
            $cond: [
              { $eq: ['$paymentMethod', PaymentMethod.Cash] },
              '$amount',
              0,
            ],
          },
          card: {
            $cond: [
              { $eq: ['$paymentMethod', PaymentMethod.Card] },
              '$amount',
              0,
            ],
          },
          dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone } },
          h: { $hour: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: '$dayOfWeek',
            hour: '$h',
          },
          totalPayment: { $sum: '$total' },
          cash: { $sum: '$cash' },
          card: { $sum: '$card' },
        },
      },
    ]);

    console.log(order);
    const response = [];

    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const emptyObj = {
      grossSales: 0,

      totalSales: 0,
      totalPayment: 0,
      cash: 0,
      card: 0,
      orderCount: 0,
    };
    let aggregate = {
      grossSales: 0,

      totalSales: 0,
      totalPayment: 0,
      cash: 0,
      card: 0,
      orderCount: 0,
    };
    for (let i = 1; i <= 7; i++) {
      const hours = [];
      for (let j = 1; j <= 24; j++) {
        const obj = order.find((o) => {
          if (o._id.dayOfWeek == i && o._id.hour == j) {
            return true;
          }
        });
        if (obj) {
          const transactionObj = transactions.find((t) => {
            if (
              t._id.dayOfWeek == obj._id.dayOfWeek &&
              t._id.hour == obj._id.hour
            ) {
              return true;
            }
          });
          obj.totalPayment = obj.cash = obj.card = 0;
          if (transactionObj) {
            obj.totalPayment = transactionObj.totalPayment;
            obj.cash = transactionObj.cash;
            obj.card = transactionObj.card;
          }
          aggregate.grossSales += obj.grossSales;
          aggregate.totalSales += obj.totalSales;
          aggregate.totalPayment += obj.totalPayment;
          aggregate.cash += obj.cash;
          aggregate.card += obj.card;
          aggregate.orderCount += obj.orderCount;
        }
        hours.push({ hour: j, data: obj ?? emptyObj });
      }
      response.push({ day: days[i - 1], hours });
    }
    response.push(aggregate);

    return response;
  }
  async dailySalesTrend(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const order = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: OrderPaymentStatus.Paid,
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
        },
      },
      // {
      //   $lookup: {
      //     from: 'transactions',
      //     let: {
      //       transactions: '$transactions',
      //     },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $in: ['$_id', '$$transactions'],
      //           },
      //           status: PaymentStatus.Success,
      //         },
      //       },
      //       {
      //         $project: {
      //           total: '$amount',
      //           cash: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Cash] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           card: {
      //             $cond: [
      //               { $eq: ['$paymentMethod', PaymentMethod.Card] },
      //               '$amount',
      //               0,
      //             ],
      //           },
      //           // hungerStation: {
      //           //   $cond: [
      //           //     { $eq: ['$paymentMethod', PaymentMethod.HungerStation] },
      //           //     '$amount',
      //           //     0,
      //           //   ],
      //           // },
      //           // jahez: {
      //           //   $cond: [
      //           //     { $eq: ['$paymentMethod', PaymentMethod.Jahez] },
      //           //     '$amount',
      //           //     0,
      //           //   ],
      //           // },
      //           // toyo: {
      //           //   $cond: [
      //           //     { $eq: ['$paymentMethod', PaymentMethod.Toyo] },
      //           //     '$amount',
      //           //     0,
      //           //   ],
      //           // },
      //         },
      //       },
      //       {
      //         $group: {
      //           _id: null,
      //           totalPayment: { $sum: '$total' },
      //           cash: { $sum: '$cash' },
      //           card: { $sum: '$card' },
      //           // hungerStation: { $sum: '$hungerStation' },
      //           // jahez: { $sum: '$jahez' },
      //           // toyo: { $sum: '$toyo' },
      //         },
      //       },
      //     ],
      //     as: 'transactions',
      //   },
      // },
      {
        $project: {
          summary: 1,

          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
          d: { $dayOfMonth: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: {
            year: '$y',
            month: '$m',
            day: '$d',
          },
          grossSales: { $sum: '$summary.totalBeforeDiscount' },
          // discounts: { $sum: '$summary.discount' },
          // netSales: { $sum: '$summary.totalTaxableAmount' },
          // tax: {
          //   $sum: '$summary.totalTax',
          // },
          // tip: {
          //   $sum: '$tip',
          // },
          // refunds: { $sum: '$summary.totalRefunded' },
          totalSales: { $sum: '$summary.totalWithTax' },
          totalPayment: { $sum: '$transactions.totalPayment' },
          // cash: { $sum: '$transactions.cash' },
          // card: { $sum: '$transactions.card' },
          orderCount: { $sum: 1 },
          // hungerStation: { $sum: '$transactions.hungerStation' },
          // jahez: { $sum: '$transactions.jahez' },
          // toyo: { $sum: '$transactions.toyo' },
        },
      },
    ]);
    const transactions = await this.transactionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          status: PaymentStatus.Success,
        },
      },
      {
        $project: {
          total: '$amount',
          cash: {
            $cond: [
              { $eq: ['$paymentMethod', PaymentMethod.Cash] },
              '$amount',
              0,
            ],
          },
          card: {
            $cond: [
              { $eq: ['$paymentMethod', PaymentMethod.Card] },
              '$amount',
              0,
            ],
          },
          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
          d: { $dayOfMonth: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: {
            year: '$y',
            month: '$m',
            day: '$d',
          },
          totalPayment: { $sum: '$total' },
          cash: { $sum: '$cash' },
          card: { $sum: '$card' },
        },
      },
    ]);
    const response = [];
    console.log(order);
    const emptyObj = {
      grossSales: 0,

      totalSales: 0,
      totalPayment: 0,
      cash: 0,
      card: 0,
      orderCount: 0,
    };
    let aggregate = {
      grossSales: 0,

      totalSales: 0,
      totalPayment: 0,
      cash: 0,
      card: 0,
      orderCount: 0,
    };
    let loop = new Date(dto.startDate);
    while (loop < dto.endDate) {
      const obj = order.find((o) => {
        if (
          o._id.year == loop.getFullYear() &&
          o._id.month == loop.getMonth() + 1 &&
          o._id.day == loop.getDate()
        ) {
          return true;
        }
      });
      if (obj) {
        const transactionObj = transactions.find((t) => {
          if (
            t._id.year == obj._id.year &&
            t._id.month == obj._id.month &&
            t._id.day == obj._id.day
          ) {
            return true;
          }
        });
        obj.totalPayment = obj.cash = obj.card = 0;
        if (transactionObj) {
          obj.totalPayment = transactionObj.totalPayment;
          obj.cash = transactionObj.cash;
          obj.card = transactionObj.card;
        }
        aggregate.grossSales += obj.grossSales;
        aggregate.totalSales += obj.totalSales;
        aggregate.totalPayment += obj.totalPayment;
        aggregate.cash += obj.cash;
        aggregate.card += obj.card;
        aggregate.orderCount += obj.orderCount;
      }
      response.push({ day: loop, data: obj ?? emptyObj });

      loop = new Date(loop.setDate(loop.getDate() + 1));
    }

    response.push(aggregate);

    return response;
  }
  async weeklySalesTrend(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const order = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
          },
        },
      },

      {
        $project: {
          summary: 1,
          tip: 1,
          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
          d: { $dayOfMonth: { date: '$createdAt', timezone } },
          weekDay: { $dayOfWeek: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: { year: '$y', month: '$m', day: '$d', weekDay: '$weekDay' },
          totalSales: { $sum: '$summary.totalWithTax' },
        },
      },
    ]);

    return order;
  }

  async yearlySalesTrend(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const order = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
          },
        },
      },

      {
        $project: {
          summary: 1,
          tip: 1,
          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: { year: '$y', month: '$m' },

          totalSales: { $sum: '$summary.totalWithTax' },
        },
      },
    ]);

    return order;
  }

  async itemSaleReport(req, dto: ItemSalesTrendReport) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    let queryToApplyBundle: any = {};
    let queryToApplyId: any = [];
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    queryToApplyBundle.restaurantId = {
      $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
    };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };

      queryToApplyBundle.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    let filterQuery = {
      $addFields: {},
    };
    let filterQueryBundle = {
      $addFields: {},
    };
    if (dto.itemIds) {
      queryToApply['items.menuItem.menuItemId'] = {
        $in: dto.itemIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
      filterQuery = {
        $addFields: {
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: {
                $in: [
                  '$$item.menuItem.menuItemId',
                  dto.itemIds.map((r) => new mongoose.Types.ObjectId(r)),
                ],
              },
            },
          },
        },
      };

      queryToApplyId = dto.itemIds.map((r) => r?.toString());

      // filterQueryBundle = {
      //   $addFields: {
      //     'bundles.bundleSubGroups.items': {
      //       $filter: {
      //         input: '$bundles.bundleSubGroups.items',
      //         as: 'item',
      //         cond: {
      //           $in: [
      //             '$$item.menuItemId',
      //             dto.itemIds.map((r) => new mongoose.Types.ObjectId(r)),
      //           ],
      //         },
      //       },
      //     },
      //   },
      // };
    }

    const records = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
        },
      },
      filterQuery,
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem.menuItemId',
          foreignField: '_id',
          as: 'items.menuItemObj',
        },
      },
      {
        $lookup: {
          from: 'profitdetails',
          let: { orderId: '$_id', itemId: '$items.menuItem.menuItemId' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ['$orderId', '$$orderId'],
                    },
                  },
                  {
                    $expr: {
                      $eq: ['$menuItemId', '$$itemId'],
                    },
                  },
                ],
              },
            },
          ],
          as: 'profitDetail',
        },
      },
      {
        $unwind: { path: '$profitDetail', preserveNullAndEmptyArrays: true },
      },      
      {
        $group: {
          _id: '$items.menuItem.menuItemId',
          item: { $first: '$items.menuItemObj' },
          quantitiesSold: { $sum: '$items.quantity' },
          grossAmount: {
            $sum: {
              $cond: [
                '$isEmployeeMeal',
                0, // If isEmployeeMeal is true, set grossAmount to 0
                '$items.amountAfterDiscount' // Otherwise, use amountAfterDiscount
              ]
            }
          },
          orderCount: { $sum: 1 },
          totalCost: { $sum: '$profitDetail.totalCost' },
          profit: { $sum: '$profitDetail.profit' },
          totalDiscount: {
            $sum: {
              $cond: [
                { $ne: ['$items.couponCode', null] },
                '$items.menuItem.discount', 0,
              ]
            }
          }        
        },
      },
    ]);

    console.log("queryToApplyBundle", queryToApplyBundle);

    let recordsBundle = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApplyBundle,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
        },
      },
      // filterQueryBundle,
      { $unwind: "$bundles" },
      { $unwind: "$bundles.bundleSubGroups" },
      { $unwind: "$bundles.bundleSubGroups.items" },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'bundles.bundleSubGroups.items.menuItemId',
          foreignField: '_id',
          as: 'items.menuItemObj',
        },
      },
      {
        $lookup: {
          from: 'profitdetails',
          let: { orderId: '$_id', itemId: '$bundles.bundleSubGroups.items.menuItemId' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ['$orderId', '$$orderId'],
                    },
                  },
                  {
                    $expr: {
                      $eq: ['$menuItemId', '$$itemId'],
                    },
                  },
                ],
              },
            },
          ],
          as: 'profitDetail',
        },
      },
      {
        $unwind: { path: '$profitDetail', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$bundles.bundleSubGroups.items.menuItemId',
          item: { $first: '$items.menuItemObj' },
          quantitiesSold: { $sum: '$bundles.bundleSubGroups.items.quantity' },
          grossAmount: { $sum: '$bundles.bundleSubGroups.items.unitPriceAfterDiscount' },
          orderCount: { $sum: 1 },
          totalCost: { $sum: '$profitDetail.totalCost' },
          profit: { $sum: '$profitDetail.profit' },
        },
      },
    ]);

    console.log("recordsBundle before", recordsBundle);

    console.log("queryToApplyId", queryToApplyId);
    if (queryToApplyId && queryToApplyId?.length > 0) {
      recordsBundle = recordsBundle.filter(item => queryToApplyId.includes(item._id?.toString()));
    }

    console.log("recordsBundle after", recordsBundle);
    const combinedArray = [...records, ...recordsBundle];
    // console.log("groupedByCategoryIdAndMenuItemId", JSON.stringify(combinedArray));

    const aggregateMap = new Map();

    combinedArray.forEach(data => {
      const {
        _id,
        item,
        quantitiesSold,
        grossAmount,
        orderCount,
        totalCost,
        profit,
        totalDiscount
      } = data;

      if (aggregateMap.has(_id?.toString())) {
        const existingItem = aggregateMap.get(_id?.toString());
        existingItem.quantitiesSold += Number(quantitiesSold);
        existingItem.grossAmount += Number(grossAmount);
        existingItem.orderCount += Number(orderCount);
        existingItem.totalCost += Number(totalCost);
        existingItem.profit += Number(profit);
        existingItem.totalDiscount += Number(totalDiscount ?? 0);
      } else {
        aggregateMap.set(_id?.toString(), {
          _id: _id?.toString(),
          item,
          quantitiesSold: Number(quantitiesSold),
          grossAmount: Number(grossAmount),
          orderCount: Number(orderCount),
          totalCost: Number(totalCost),
          profit: Number(profit),
          totalDiscount: Number(totalDiscount ?? 0)
        });
      }
    });

    // Convert map values to an array
    const aggregatedArray = [...aggregateMap.values()];


    let aggregate = {
      quantitiesSold: 0,
      grossAmount: 0,
      orderCount: 0,
      totalCost: 0,
      profit: 0,
      totalDiscount: 0
    };
    aggregatedArray.forEach((o) => {
      aggregate.quantitiesSold += o.quantitiesSold;
      aggregate.grossAmount += o.grossAmount;
      aggregate.orderCount += o.orderCount;
      aggregate.totalCost += o.totalCost;
      aggregate.profit += o.profit;
      aggregate.totalDiscount += o.totalDiscount;
    });

    aggregatedArray.push(aggregate);
    return aggregatedArray;
  }

  async itemSaleHourlyReport(req, dto: SalesTrendReportDailyDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate) {
      let endDate = dto.startDate;
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );

      endDate.setUTCHours(23);
      endDate.setUTCMinutes(60);
      endDate = new Date(endDate.toLocaleString('en', { timeZone: timezone }));

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: endDate,
      };
    }
    console.log(queryToApply);
    const records = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
          },
        },
      },

      { $unwind: '$items' },
      {
        $project: {
          items: 1,
          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
          d: { $dayOfMonth: { date: '$createdAt', timezone } },
          h: { $hour: { date: '$createdAt', timezone } },
        },
      },

      {
        $group: {
          _id: {
            item: '$items.menuItem.menuItemId',
            year: '$y',
            month: '$m',
            day: '$d',
            hour: '$h',
          },
          name: { $first: '$items.menuItem.name' },
          nameAr: { $first: '$items.menuItem.nameAr' },
          quantitiesSold: { $sum: '$items.quantity' },
          grossAmount: { $sum: '$items.amountAfterDiscount' },
        },
      },
    ]);
    return records;
  }

  async categorySaleReport(req, dto: CategorySalesTrendReport) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    let queryToApplyBundle: any = {};

    if (dto.restaurantIds && dto.restaurantIds.length > 0) {
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };

      queryToApplyBundle.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    }


    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };

      queryToApplyBundle.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    let filterQuery = {
      $addFields: {},
    };
    let filterQueryBundle = {
      $addFields: {},
    };
    let queryToApplyId = [];

    if (dto.categoryIds) {
      queryToApply['items.menuItem.categoryId'] = {
        $in: dto.categoryIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
      filterQuery = {
        $addFields: {
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: {
                $in: [
                  '$$item.menuItem.categoryId',
                  dto.categoryIds.map((r) => new mongoose.Types.ObjectId(r)),
                ],
              },
            },
          },
        },
      };

      // queryToApplyBundle['bundles.bundleSubGroups.items.categoryId'] = {
      //   $in: dto.categoryIds.map((r) => r?.toString()),
      // };
      queryToApplyId = dto.categoryIds.map((r) => r?.toString());
      // filterQueryBundle = {
      //   $addFields: {
      //     items: {
      //       $filter: {
      //         input: '$bundles.bundleSubGroups.items',
      //         as: 'item',
      //         cond: {
      //           $in: [
      //             '$$item.categoryId',
      //             dto.categoryIds.map((r) => new mongoose.Types.ObjectId(r)),
      //           ],
      //         },
      //       },
      //     },
      //   },
      // };

    }

    console.log(queryToApply);
    const records = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
        },
      },
      filterQuery,
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem.menuItemId',
          foreignField: '_id',
          as: 'items.menuItemObj',
        },
      },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'items.menuItemObj.categoryId',
          foreignField: '_id',
          as: 'items.category',
        },
      },
      {
        $lookup: {
          from: 'profitdetails',
          let: { orderId: '$_id', itemId: '$items.menuItem.menuItemId' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ['$orderId', '$$orderId'],
                    },
                  },
                  {
                    $expr: {
                      $eq: ['$menuItemId', '$$itemId'],
                    },
                  },
                ],
              },
            },
          ],
          as: 'profitDetail',
        },
      },
      {
        $unwind: { path: '$profitDetail', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          'items.category': {
            $first: '$items.category',
          },
        },
      },

      {
        $group: {
          _id: '$items.category._id',
          quantitiesSold: { $sum: '$items.quantity' },
          grossAmount: { $sum: '$items.amountAfterDiscount' },
          orderCount: { $sum: 1 },
          category: { $first: '$items.category' },
          totalCost: { $sum: '$profitDetail.totalCost' },
          profit: { $sum: '$profitDetail.profit' },
        },
      },
    ]);

    let recordsBundle = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApplyBundle,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
        },
      },
      filterQueryBundle,
      { $unwind: "$bundles" },
      { $unwind: "$bundles.bundleSubGroups" },
      { $unwind: "$bundles.bundleSubGroups.items" },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'bundles.bundleSubGroups.items.menuItemId',
          foreignField: '_id',
          as: 'items.menuItemObj',
        },
      },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'bundles.bundleSubGroups.items.categoryId',
          foreignField: '_id',
          as: 'items.category',
        },
      },
      {
        $lookup: {
          from: 'profitdetails',
          let: { orderId: '$_id', itemId: '$bundles.bundleSubGroups.items.menuItemId' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ['$orderId', '$$orderId'],
                    },
                  },
                  {
                    $expr: {
                      $eq: ['$menuItemId', '$$itemId'],
                    },
                  },
                ],
              },
            },
          ],
          as: 'profitDetail',
        },
      },
      {
        $unwind: { path: '$profitDetail', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          'items.category': {
            $first: '$items.category',
          },
        },
      },

      {
        $group: {
          _id: '$items.category._id',
          quantitiesSold: { $sum: '$bundles.bundleSubGroups.items.quantity' },
          grossAmount: { $sum: '$bundles.bundleSubGroups.items.unitPriceAfterDiscount' },
          orderCount: { $sum: 1 },
          category: { $first: '$items.category' },
          totalCost: { $sum: '$profitDetail.totalCost' },
          profit: { $sum: '$profitDetail.profit' },
        },
      },
    ]);

    console.log("queryToApplyId", queryToApplyId);
    if (queryToApplyId && queryToApplyId?.length > 0) {
      recordsBundle = recordsBundle.filter(item => queryToApplyId.includes(item._id?.toString()));
    }
    const combinedArray = [...records, ...recordsBundle];
    console.log("groupedByCategoryIdAndMenuItemId", JSON.stringify(combinedArray));

    const aggregateMap = new Map();

    combinedArray.forEach(data => {
      const {
        _id,
        category,
        quantitiesSold,
        grossAmount,
        orderCount,
        totalCost,
        profit
      } = data;

      if (aggregateMap.has(_id?.toString())) {
        const existingItem = aggregateMap.get(_id?.toString());
        existingItem.quantitiesSold += Number(quantitiesSold);
        existingItem.grossAmount += Number(grossAmount);
        existingItem.orderCount += Number(orderCount);
        existingItem.totalCost += Number(totalCost);
        existingItem.profit += Number(profit);
      } else {
        aggregateMap.set(_id?.toString(), {
          _id: _id?.toString(),
          category,
          quantitiesSold: Number(quantitiesSold),
          grossAmount: Number(grossAmount),
          orderCount: Number(orderCount),
          totalCost: Number(totalCost),
          profit: Number(totalCost)
        });
      }
    });

    // Convert map values to an array
    const aggregatedArray = [...aggregateMap.values()];


    let aggregate = {
      quantitiesSold: 0,
      grossAmount: 0,
      orderCount: 0,
      totalCost: 0,
      profit: 0,
    };
    aggregatedArray.forEach((o) => {
      aggregate.quantitiesSold += o.quantitiesSold;
      aggregate.grossAmount += o.grossAmount;
      aggregate.orderCount += o.orderCount;
      aggregate.totalCost += o.totalCost;
      aggregate.profit += o.profit;
    });

    aggregatedArray.push(aggregate);
    return aggregatedArray;
  }

  async categorySaleHourlyReport(req, dto: SalesTrendReportDailyDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate) {
      let endDate = dto.startDate;
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );

      endDate.setUTCHours(23);
      endDate.setUTCMinutes(60);
      endDate = new Date(endDate.toLocaleString('en', { timeZone: timezone }));

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: endDate,
      };
    }
    console.log(queryToApply);
    const records = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
        },
      },

      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem.menuItemId',
          foreignField: '_id',
          as: 'items.menuItemObj',
        },
      },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'items.menuItemObj.categoryId',
          foreignField: '_id',
          as: 'items.category',
        },
      },
      {
        $addFields: {
          'items.category': {
            $first: '$items.category',
          },
        },
      },

      {
        $project: {
          items: 1,
          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
          d: { $dayOfMonth: { date: '$createdAt', timezone } },
          h: { $hour: { date: '$createdAt', timezone } },
        },
      },

      {
        $group: {
          _id: {
            item: '$items.category._id',
            year: '$y',
            month: '$m',
            day: '$d',
            hour: '$h',
          },
          category: { $first: '$items.category.name' },
          categoryAr: { $first: '$items.category.nameAr' },
          quantitiesSold: { $sum: '$items.quantity' },
          grossAmount: { $sum: '$items.amountAfterDiscount' },
        },
      },
    ]);
    return records;
  }

  async additionSaleReport(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const records = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
          'items.additions': {
            $ne: [],
          },
        },
      },

      { $unwind: '$items' },

      {
        $group: {
          _id: {
            item: '$items.menuItem.menuItemId',
            addition: '$items.additions.menuAdditionId',
          },
          quantitiesSold: { $sum: '$items.quantity' },
          grossAmount: { $sum: '$items.amountBeforeDiscount' },
          discount: { $sum: '$items.discount' },
          amountAfterDiscount: { $sum: '$items.amountAfterDiscount' },
          tax: { $sum: '$items.tax' },
          name: { $first: '$items.menuItem.name' },
          nameAr: { $first: '$items.menuItem.nameAr' },
          addition: { $first: '$items.additions.name' },
          additionAr: { $first: '$items.additions.nameAr' },
        },
      },
    ]);
    return records;
  }

  async teamSalesReport(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const orders = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'waiterId',
          foreignField: '_id',
          as: 'waiter',
        },
      },
      {
        $project: {
          waiterId: 1,
          waiter: 1,
          summary: 1,
          tip: 1,
        },
      },
      {
        $addFields: {
          waiter: {
            $first: '$waiter',
          },
        },
      },
      {
        $group: {
          _id: '$waiterId',
          waiter: { $first: '$waiter.name' },
          totalSales: { $sum: '$summary.totalWithTax' },
          refunds: { $sum: '$summary.totalRefunded' },
        },
      },
    ]);

    return orders;
  }

  async discountSalesReport(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const orders = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
          $and: [
            {
              couponCode: { $ne: null },
            },
            {
              couponCode: { $ne: '' },
            },
          ],
        },
      },
      {
        $group: {
          _id: '$couponCode',
          totalSales: { $sum: '$summary.totalWithTax' },
          refunds: { $sum: '$summary.totalRefunded' },
        },
      },
    ]);

    return orders;
  }

  async salesTaxReport(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    console.log(queryToApply);
    const orders = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          paymentStatus: {
            $in: [
              OrderPaymentStatus.Paid,
              OrderPaymentStatus.OverPaid,
              OrderPaymentStatus.PartiallyRefunded,
              OrderPaymentStatus.PartiallyPaid
            ]
          },
        },
      },
      {
        $group: {
          _id: '$taxRate',
          totalSales: { $sum: '$summary.totalWithTax' },
          discount: { $sum: '$summary.discount' },
          taxableAmount: { $sum: '$summary.totalTaxableAmount' },
          totalTax: { $sum: '$summary.totalTax' },
        },
      },
    ]);

    return orders;
  }

  async goodsReceiptByVendorReport(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };

    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    const orders = await this.grModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $lookup: {
          from: 'purchaseorders',
          localField: 'purchaseOrderId',
          foreignField: '_id',
          as: 'purchaseOrder',
        },
      },
      { $unwind: '$purchaseOrder' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'purchaseOrder.vendorId',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$purchaseOrder.vendorId',
          totalCost: { $sum: '$totalCost' },
          tax: { $sum: '$tax' },
          vendorName: { $first: '$vendor.name' },
          vendorNameAr: { $first: '$vendor.nameAr' },
          vatNumber: { $first: '$vendor.vatNumber' },
        },
      },
      {
        $project: {
          vendorId: '$_id',
          vendorName: 1,
          vendorNameAr: 1,
          vatNumber: 1,
          totalCost: 1,
          tax: 1,
          _id: 0,
        },
      },
    ]);
    return orders;
  }

  async invoiceReceiptByVendorReport(req, dto: SalesReportDto) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };

    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: timezone }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }
    const orders = await this.irModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $lookup: {
          from: 'purchaseorders',
          localField: 'purchaseOrderId',
          foreignField: '_id',
          as: 'purchaseOrder',
        },
      },
      { $unwind: '$purchaseOrder' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'purchaseOrder.vendorId',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$purchaseOrder.vendorId',
          totalCost: { $sum: '$totalCost' },
          tax: { $sum: '$tax' },
          vendorName: { $first: '$vendor.name' },
          vendorNameAr: { $first: '$vendor.nameAr' },
          vatNumber: { $first: '$vendor.vatNumber' },
        },
      },
      {
        $project: {
          vendorId: '$_id',
          vendorName: 1,
          vendorNameAr: 1,
          vatNumber: 1,
          totalCost: 1,
          tax: 1,
          _id: 0,
        },
      },
    ]);
    return orders;
  }
}
