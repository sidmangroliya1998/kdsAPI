import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import mongoose, { Model } from 'mongoose';

import { Cashier, CashierDocument } from './schemas/cashier.schema';
import { CashierLogService } from './cashier-log.service';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { CashierLogDocument } from './schemas/cashier-log.schema';
import { roundOffNumber } from '../core/Helpers/universal.helper';
import {
  DeferredTransaction,
  DeferredTransactionDocument,
} from 'src/order/schemas/deferred-transaction.schema';
import { TableLog, TableLogDocument } from 'src/table/schemas/table-log.schema';
import { Table, TableDocument } from 'src/table/schemas/table.schema';
import { OrderStatus } from 'src/order/enum/en.enum';

@Injectable()
export class CashierHelperService {
  constructor(
    @InjectModel(Cashier.name)
    private readonly cashierModel: Model<CashierDocument>,
    @Inject(forwardRef(() => CashierLogService))
    private readonly cashierLogService: CashierLogService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(DeferredTransaction.name)
    private readonly deferredTransactionModel: Model<DeferredTransactionDocument>,
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
  ) { }

  async postCashierCreate(req, cashier: CashierDocument) {
    this.keepOnlyOneDefault(cashier);
  }

  async postCashierUpdate(cashier: CashierDocument, dto) {
    if (dto.default == true) this.keepOnlyOneDefault(cashier);
  }

  async keepOnlyOneDefault(cashier) {
    if (cashier.default == true) {
      await this.cashierModel.updateMany(
        {
          restaurantId: cashier.restaurantId,
          _id: { $ne: cashier._id },
        },
        {
          $set: {
            default: false,
          },
        },
      );
    }
  }

  foldAmount(records: any[]): number {
    return records.reduce((prev, acc) => prev + acc.amount, 0);
  }

  async prepareDashboardData(cashierLog: any) {
    const deferredTransactions = await this.deferredTransactionModel.find({
      cashierId: cashierLog.cashierId?._id,
      createdAt: {
        $gte: cashierLog.startedAt,
        $lte: cashierLog.closedAt ?? new Date(),
      },
    });

    const openTableLogs = await this.tableModel.aggregate(
      [
        {
          $match: {
            supplierId: new mongoose.Types.ObjectId(
              cashierLog.supplierId.toString(),
            ),
            deletedAt: null,
            restaurantId: new mongoose.Types.ObjectId(
              cashierLog.cashierId?.restaurantId?.toString(),
            )
          },
        },
        {
          $lookup: {
            from: 'tablelogs',
            localField: 'currentTableLog',
            foreignField: '_id',
            as: 'currentTableLog',
          },
        },
        {
          $match: {
            currentTableLog: { $ne: [] },
          },
        },

        {
          $addFields: {
            currentTableLog: {
              $cond: {
                if: { $eq: [{ $size: '$currentTableLog' }, 1] },
                then: { $arrayElemAt: ['$currentTableLog', 0] },
                else: null,
              },
            },
          },
        },

        {
          $lookup: {
            from: 'orders',
            localField: 'currentTableLog.orders',
            foreignField: '_id',
            as: 'orders',
          },
        },
        {
          $addFields: {
            activeOrders: {
              $filter: {
                input: '$orders',
                cond: {
                  $in: [
                    '$$this.status',
                    [
                      OrderStatus.New,
                      OrderStatus.SentToKitchen,
                      OrderStatus.StartedPreparing,
                      OrderStatus.DonePreparing,
                      OrderStatus.OnTable,
                      OrderStatus.Closed,
                    ],
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            amount: {
              $sum: '$activeOrders.summary.remainingAmountToCollect',
            },
          },
        },
        {
          $project: {
            amount: 1,
          },
        },
      ],
      { allowDiskUse: true },
    );

    const transactions = cashierLog.transactions;
    const refunds = transactions.filter((t) => t.isRefund);
    const sales = transactions.filter((t) => !t.isRefund);
    const cashSales = sales.filter(
      (s) => s.paymentMethod === PaymentMethod.Cash,
    );
    const bankSales = sales.filter(
      (s) =>
        s.paymentMethod === PaymentMethod.Online ||
        s.paymentMethod === PaymentMethod.Card,
    );
    const HungerStationSales = sales.filter(
      (s) => s.paymentMethod === PaymentMethod.HungerStation,
    );
    const JahezSales = sales.filter(
      (s) => s.paymentMethod === PaymentMethod.Jahez,
    );
    const ToyoSales = sales.filter(
      (s) => s.paymentMethod === PaymentMethod.Toyo,
    );
    const OtherSales = sales.filter(
      (s) => s.paymentMethod === PaymentMethod.Other,
    );
    const expense = cashierLog?.expenses?.reduce(
      (prev, acc) => prev + acc.expense,
      0,
    );
    const tip = cashierLog?.transactions?.reduce(
      (prev, t) => prev + (t?.orderId?.tip ?? 0),
      0,
    );
    const deferredAmount = this.foldAmount(deferredTransactions);
    const dashboard = {
      openingBalance: roundOffNumber(cashierLog.openingBalance),
      totalRefunds: roundOffNumber(this.foldAmount(refunds)),
      totalSales: roundOffNumber(this.foldAmount(sales) + deferredAmount),
      salesPaidWithCash: roundOffNumber(this.foldAmount(cashSales)),
      salesPaidWithCard: roundOffNumber(this.foldAmount(bankSales)),
      salesPaidWithHungerStation: roundOffNumber(this.foldAmount(HungerStationSales)),
      salesPaidWithJahezSales: roundOffNumber(this.foldAmount(JahezSales)),
      salesPaidWithToyoSales: roundOffNumber(this.foldAmount(ToyoSales)),
      salesPaidWithOtherSales: roundOffNumber(this.foldAmount(OtherSales)),
      expectedCashAtClose: roundOffNumber(
        cashierLog.openingBalance +
        this.foldAmount(cashSales) -
        this.foldAmount(refunds) -
        expense,
      ),
      deferredAmount: roundOffNumber(deferredAmount),
      totalRemianingAmountToCollect: cashierLog?.remainingAmountToCollect ?
        roundOffNumber(cashierLog?.remainingAmountToCollect) :
        roundOffNumber(this.foldAmount(openTableLogs)),
      expenseAmount: roundOffNumber(expense),
      tip: roundOffNumber(tip),
    };
    return dashboard;
  }

  async resolveCashierId(
    req: any,
    cashierId,
    autoStart = false,
    restaurantId = null,
  ) {
    let cashier = null;
    if (!cashierId || cashierId == null) {

      // if (req.user.isCustomer) {
      //   cashier = await this.cashierModel.findOne({
      //     restaurantId,
      //     default: true,
      //   });
      //   if (!cashier)
      //     throw new BadRequestException(
      //       VALIDATION_MESSAGES.NoCashierAvailable.key,
      //     );

      //   cashierId = cashier._id;
      // } else {
      //   const user = await this.userModel.findById(req.user.userId);
      //   if (user) cashierId = user.cashier;
      //   if (!cashierId) {
      //     cashier = await this.cashierModel.findOne({
      //       restaurantId,
      //       default: true,
      //     });
      //     if (!cashier)
      //       throw new BadRequestException(
      //         VALIDATION_MESSAGES.NoCashierAvailable.key,
      //       );

      //     cashierId = cashier._id;
      //   }
      // }

      cashier = await this.cashierModel.findOne({
        restaurantId,
        default: true,
      }).populate([
        {
          path: 'currentLog'
        }
      ]);

      if (!cashier)
        throw new BadRequestException(
          VALIDATION_MESSAGES.NoCashierAvailable.key,
        );

      cashierId = cashier._id;
    }

    if (!cashierId) {
      throw new BadRequestException(VALIDATION_MESSAGES.NoCashierAvailable.key);
    }
    if (autoStart) {
      // console.log("cashier", cashier);
      if (!cashier) {
        cashier = await this.cashierModel.findById(cashierId).populate([
          {
            path: 'currentLog'
          }
        ]);
        if (!cashier)
          throw new BadRequestException(
            VALIDATION_MESSAGES.NoCashierAvailable.key,
          );
      }
      if (!cashier.currentLog || (cashier.currentLog && cashier.currentLog?.closedAt
        && cashier.currentLog?.closedAt != null && cashier.currentLog?.closedAt != '')) {
        if (req.user.isCustomer) {
          await this.cashierLogService.autoStartCashier(null, cashier);
        } else {
          await this.cashierLogService.autoStartCashier(req, cashier);
        }
      }
    }

    return cashierId;
  }
}
