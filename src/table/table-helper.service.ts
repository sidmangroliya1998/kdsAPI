import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Table, TableDocument } from './schemas/table.schema';
import mongoose, { Model } from 'mongoose';

import { TableLog, TableLogDocument } from './schemas/table-log.schema';

import { Order, OrderDocument } from 'src/order/schemas/order.schema';

import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { TableStatus } from './enum/en.enum';
import { OrderStatus, PreparationStatus } from 'src/order/enum/en.enum';

@Injectable()
export class TableHelperService {
  constructor(
    @InjectModel(TableLog.name)
    private readonly tableLogModel: Model<TableLogDocument>,
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private socketGateway: SocketIoGateway,
  ) {}

  async handlePaymentNeeded(tableId: string, tableLog = null) {
    if (!tableLog) {
      const table = await this.tableModel.findById(tableId);
      if (table && table.currentTableLog) {
        tableLog = await this.tableLogModel.findById(table.currentTableLog);
      }
    }
    if (tableLog) {
      const result = await this.orderModel.aggregate([
        {
          $match: {
            _id: { $in: tableLog.orders },
            status: {
              $nin: [
                OrderStatus.Cancelled,
                OrderStatus.CancelledWihPaymentFailed,
                OrderStatus.Closed,
                OrderStatus.CancelledByMerge,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: '$summary.totalPaid' },
            total: { $sum: '$summary.totalWithTax' },
          },
        },
      ]);
      console.log(result);
      tableLog.paymentNeeded = false;
      if (result && result.length == 1) {
        if (result[0].totalPaid < result[0].total) {
          tableLog.paymentNeeded = true;
        }
      }
      tableLog.save();
      this.socketGateway.emit(
        tableLog.supplierId.toString(),
        SocketEvents.TableLog,
        tableLog.toObject(),
      );
    }
  }

  async handleTableTransfer(order: OrderDocument, sourceTableId) {
    if (sourceTableId) {
      const table = await this.tableModel.findById(sourceTableId);
      if (table && table.currentTableLog) {
        const tableLog = await this.tableLogModel.findByIdAndUpdate(
          table.currentTableLog,
          {
            $pull: { orders: order._id },
          },
          { new: true },
        );
        this.handlePaymentNeeded(sourceTableId, tableLog);
      }
    }

    await this.addOrderToTableLogWithAutoStart(order);
  }

  async handleReadyFlag(order: OrderDocument) {
    const table = await this.tableModel.findById(order.tableId);
    if (table && table.currentTableLog) {
      const tableLog = await this.tableLogModel.findById(table.currentTableLog);
      if (tableLog) {
        const orders = await this.orderModel.find({
          _id: { $in: tableLog.orders },
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.CancelledWihPaymentFailed,
              OrderStatus.Closed,
            ],
          },
        });
        const donePreparingOrders = orders.filter(
          (o) => o.status == OrderStatus.DonePreparing,
        );
        const donePreparingItems = orders.filter((o) => {
          const item = o.items.find(
            (oi) => oi.preparationStatus == PreparationStatus.DonePreparing,
          );
          if (item) return true;
        });
        tableLog.orderReady = false;
        if (donePreparingOrders.length > 0) {
          tableLog.orderReady = true;
        }
        tableLog.itemReady = false;
        if (donePreparingItems.length > 0) {
          tableLog.itemReady = true;
        }

        tableLog.save();
        this.socketGateway.emit(
          tableLog.supplierId.toString(),
          SocketEvents.TableLog,
          tableLog.toObject(),
        );
      }
    }
  }

  async addOrderToTableLogWithAutoStart(order: OrderDocument) {
    const session = await this.tableLogModel.startSession();
    session.startTransaction();
    const tableLog = await this.tableLogModel.findOneAndUpdate(
      {
        tableId: order.tableId,
        closingTime: null,
      },
      {
        $push: { orders: order._id },
        $setOnInsert: {
          supplierId: order.supplierId,
          restaurantId: order.restaurantId,
          waiterId: order.waiterId,
          startingTime: new Date(),
          tableId: order.tableId,
          guestCount: 1
        },
      },
      { upsert: true, sort: { _id: -1 }, setDefaultsOnInsert: true, new: true },
    );
    await session.commitTransaction();

    await this.tableModel.findByIdAndUpdate(order.tableId, {
      status: TableStatus.InUse,
      currentTableLog: tableLog._id,
    });
    this.handlePaymentNeeded(tableLog.tableId.toString(), tableLog);
    session.endSession();

    // const table = await this.tableModel.findById(order.tableId);
    // if (table) {
    //   let tableLog = null;
    //   if (table.currentTableLog) {
    //     tableLog = await this.tableLogModel.findByIdAndUpdate(
    //       table.currentTableLog,
    //       {
    //         $push: { orders: order._id },
    //       },
    //       { new: true },
    //     );
    //   } else {
    //     tableLog = await this.tableLogModel.create({
    //       orders: [order._id],
    //       supplierId: order.supplierId,
    //       restaurantId: order.restaurantId,
    //       waiterId: order.waiterId,
    //       startingTime: new Date(),
    //       tableId: table._id,
    //     });
    //     await this.tableModel.findByIdAndUpdate(order.tableId, {
    //       status: TableStatus.InUse,
    //       currentTableLog: tableLog._id,
    //     });
    //   }
    //   this.handlePaymentNeeded(tableLog.tableId.toString(), tableLog);

    //   return tableLog;
    // }
  }
}
