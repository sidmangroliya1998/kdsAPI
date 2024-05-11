import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { LeanDocument, Model, PaginateModel, PaginateResult } from 'mongoose';

import { TransactionQueryDto } from './transaction.dto';

import {
  Transaction,
  TransactionDocument,
} from './schemas/transactions.schema';
import { PaymentStatus, PaymentTarget } from 'src/core/Constants/enum';
import { STATUS_MSG } from 'src/core/Constants/status-message.constants';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import { OrderHelperService } from 'src/order/order-helper.service';
import {
  OrderActivityType,
  OrderStatus,
  OrderPaymentStatus,
  OrderType,
} from 'src/order/enum/en.enum';
import { capitalize } from 'src/core/Helpers/universal.helper';
import { TableLog, TableLogDocument } from 'src/table/schemas/table-log.schema';

import { CashierLogService } from 'src/cashier/cashier-log.service';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import { OrderService } from 'src/order/order.service';
import { TableHelperService } from 'src/table/table-helper.service';
import { InvoiceService } from 'src/invoice/invoice.service';
import { InvoiceType } from 'src/invoice/invoice.enum';
import { DeliveryService } from 'src/delivery/delivery.service';
import { OrderNotificationService } from 'src/order/order-notification.service';
import { OrderEvents } from 'src/notification/enum/en.enum';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { ProfitDetailService } from 'src/profit-detail/profit-detail.service';

import { PaymentMethod } from 'src/payment/enum/en.enum';
import { ChangeTransactionPaymentMethodDto } from './dto/change-payment-method.dto';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Transaction.name)
    private transactionModelPag: PaginateModel<TransactionDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(TableLog.name)
    private readonly tableLogModel: Model<TableLogDocument>,
    private orderHelperService: OrderHelperService,
    private orderService: OrderService,
    private cashierLogService: CashierLogService,
    private tableHelperService: TableHelperService,
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private readonly orderNotificationService: OrderNotificationService,
    private readonly profitDetailService: ProfitDetailService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
  ) { }

  async create(req: any, transactionDetail: any): Promise<TransactionDocument> {
    return await this.transactionModel.create({
      ...transactionDetail,
      addedBy: req ? req.user.userId : null,
    });
  }

  async get(transactionId: string): Promise<LeanDocument<TransactionDocument>> {
    const transaction = await this.transactionModel.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }

    return transaction;
  }

  async update(
    transactionId: string,
    transactionDetail: any,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findByIdAndUpdate(
      transactionId,
      transactionDetail,
      { new: true },
    );
    if (!transaction) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }
    return transaction;
  }

  async all(
    req: any,
    query: TransactionQueryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<TransactionDocument>> {
    return await this.transactionModelPag.paginate(
      { ...query },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'supplierId',
            select: { name: 1, nameAr: 1 },
            match: { deletedAt: null },
          },
          {
            path: 'orderId',
            // select: { reservationNumber: 1 },
          },
        ],
      },
    );
  }

  async changePaymentMethod(
    req: any,
    dto: ChangeTransactionPaymentMethodDto,
  ): Promise<any> {
    return await this.transactionModel.update(
      {
        _id: { $in: dto.transactionIds },
        paymentMethod: { $ne: PaymentMethod.Online },
      },
      { paymentMethod: dto.paymentMethod },
    );
  }

  async postTransactionProcess(
    req: any,
    transaction: TransactionDocument,
  ): Promise<void> {
    if (transaction.status == PaymentStatus.Success) {
      const order = await this.orderModel
        .findById(transaction.orderId)
        .populate([
          {
            path: 'supplierId',
          },
        ]);
      // save activity
      this.orderHelperService.storeOrderStateActivity(
        order,
        transaction.isRefund
          ? OrderActivityType.Refunded
          : OrderActivityType.PaymentReceived,
        new Date(),
      );

      // log the transaction in cashier
      this.cashierLogService.storeCurrentBalance(
        transaction.cashierId,
        transaction,
      );

      if (transaction.isRefund) {
        this.orderService.generalUpdate(req, order._id, {
          $inc: { 'summary.totalRefunded': transaction.amount },
          paymentStatus:
            order.summary.totalRefunded + transaction.amount ==
              order.summary.totalPaid
              ? OrderPaymentStatus.Refunded
              : OrderPaymentStatus.PartiallyRefunded,
          $push: { transactions: transaction._id },
        });
        this.glVoucherHelperService.handleRefund(transaction);
      } else {
        const result = await this.transactionModel.aggregate([
          {
            $match: {
              orderId: transaction.orderId,
              status: PaymentStatus.Success,
              isRefund: false,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);
        if (result && result.length == 1) {
          const total = result[0].total;
          let remainingAmount =
            order.summary.totalWithTax + (order.tip ?? 0) - total;
          if (remainingAmount < 0) remainingAmount = 0;
          const dataToUpdate: any = {
            'summary.totalPaid': total,
            'summary.remainingAmountToCollect': remainingAmount,
          };
          if (total > order.summary.totalWithTax + (order.tip ?? 0)) {
            dataToUpdate.status = order.orderType == OrderType.Delivery ?
              OrderStatus.SentToKitchen : (
                order.status == OrderStatus.New
                  ? OrderStatus.SentToKitchen
                  : OrderStatus.Closed);
            dataToUpdate.paymentStatus = OrderPaymentStatus.OverPaid;
            dataToUpdate.paymentTime = new Date();
          } else if (total == order.summary.totalWithTax + (order.tip ?? 0)) {
            dataToUpdate.status = order.orderType == OrderType.Delivery ?
              OrderStatus.SentToKitchen : (
                order.status == OrderStatus.New
                  ? OrderStatus.SentToKitchen
                  : OrderStatus.Closed);
            dataToUpdate.paymentStatus = OrderPaymentStatus.Paid;
            dataToUpdate.paymentTime = new Date();
          } else {
            dataToUpdate.paymentStatus = OrderPaymentStatus.NotPaid;
          }

          order.set(dataToUpdate);
          //if (!order.cashierId) order.cashierId = transaction.cashierId;
          await order.save();
          if (
            order.paymentStatus == OrderPaymentStatus.Paid ||
            order.paymentStatus == OrderPaymentStatus.OverPaid
          ) {
            try {
              await this.invoiceService.create(req, {
                orderId: order._id,
                type: order.supplierId.massInvoice
                  ? InvoiceType.Receipt
                  : InvoiceType.Invoice,
              });
            } catch (err) {
              console.log(err);
            }

            this.orderNotificationService.triggerOrderNotification(
              OrderEvents.OrderPaid,
              order,
            );
            // if (order.orderType == OrderType.Delivery)
            //   this.deliveryService.create(order);

            this.profitDetailService.updatePaymentStatus(
              order._id,
              order.paymentStatus,
            );

            // handle accounting
            if (order.trasferredToGl)
              this.glVoucherHelperService.handleSalesPayment(order);
            else if (order.supplierId.applyAccountingOnPayment) {
              this.glVoucherHelperService.handleSale(order);
            }
          }
          this.orderHelperService.postOrderUpdate(order, dataToUpdate);

          // update table log
          if (order.tableId) {
            this.tableHelperService.handlePaymentNeeded(
              order.tableId.toString(),
            );
          }
        }
      }
    }
  }
}
