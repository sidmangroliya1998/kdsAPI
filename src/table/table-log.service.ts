import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Table, TableDocument } from './schemas/table.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

import { TableLog, TableLogDocument } from './schemas/table-log.schema';

import { TableLogDto } from './dto/table-log.dto';
import { TableLogStatus, TableStatus } from './enum/en.enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { TableService } from './table.service';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import {
  OrderStatus,
  OrderPaymentStatus,
  PreparationStatus,
  OrderType,
} from 'src/order/enum/en.enum';
import { SocketIoService } from 'src/socket-io/socket-io.service';
import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { Restaurant } from 'src/restaurant/schemas/restaurant.schema';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { QueryReadyToServeItemsDto } from './dto/query-table.dto';
import { KitchenQueue } from '../kitchen-queue/schemas/kitchen-queue.schema';

@Injectable()
export class TableLogService {
  constructor(
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
    @InjectModel(TableLog.name)
    private readonly tableLogModelPag: PaginateModel<TableLogDocument>,
    @InjectModel(TableLog.name)
    private readonly tableLogModel: Model<TableLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private tableService: TableService,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private socketGateway: SocketIoGateway,
  ) { }

  async current(tableId: string): Promise<TableLogDocument> {
    const table = await this.tableModel.findById(tableId);
    const exists = await this.tableLogModel.findById(table?.currentTableLog);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async logs(
    req: any,
    tableId: string,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<TableLogDocument>> {
    const cashierLogs = await this.tableLogModelPag.paginate(
      {
        tableId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return cashierLogs;
  }

  async logTable(
    req,
    tableId: string,
    start = true,
    guestCount: number = 1
  ): Promise<TableLogDocument> {
    let tableLog = null;

    const table = await this.tableModel.findById(tableId);

    if (start) {
      // const session = await this.tableLogModel.startSession();
      // session.startTransaction();
      console.log("Hello start")
      const openTableCount = await this.tableLogModel.count({
        tableId: tableId,
        status: TableLogStatus.Open
      });

      if (openTableCount == 0) {

        const tableLogUpdate = await this.tableLogModel.findOneAndUpdate(
          {
            tableId: tableId,
            closingTime: null,
            status: TableLogStatus.Open
          },
          {
            $set: { guestCount: guestCount },
            $setOnInsert: {
              supplierId: table.supplierId,
              restaurantId: table.restaurantId,
              waiterId: req.user.userId,
              tableId: tableId
            },
          },
          {
            upsert: true,
            sort: { _id: -1 },
            setDefaultsOnInsert: true,
            new: true,
          },
        );
        console.log("tableLogUpdate._id", tableLogUpdate);
        try {
          const checkLatestStatus = await this.tableLogModel.findById(tableLogUpdate._id);
          if (checkLatestStatus && checkLatestStatus?.status == TableLogStatus.Open) {
            await this.tableModel.findByIdAndUpdate(tableId, {
              status: TableStatus.InUse,
              currentTableLog: tableLogUpdate._id,
            });
          }
          tableLog = tableLogUpdate;
        } catch (error) {
          console.log("tableLogUpdate error", error);

          if ((await this.orderModel.count({
            paymentStatus: OrderPaymentStatus.NotPaid,
            status: {
              $nin: [
                OrderStatus.Cancelled,
                OrderStatus.Closed,
                OrderStatus.CancelledByMerge,
                OrderStatus.CancelledWihPaymentFailed,
              ],
            },
            tableId: tableId
          })) > 0
          ) {
            throw new BadRequestException(
              VALIDATION_MESSAGES.OrdersPendingToClose.key,
            );
          }
          await this.tableModel.findByIdAndUpdate(tableId, {
            status: TableStatus.Empty,
            currentTableLog: null,
          });
          await this.tableLogModel.findByIdAndUpdate(tableLogUpdate._id,
            {
              closingTime: new Date(),
              status: TableLogStatus.Closed
            });
        }
      } else {
        console.log("tableLogUpdate TableStarted");
        if ((await this.orderModel.count({
          paymentStatus: OrderPaymentStatus.NotPaid,
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.Closed,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
          tableId: tableId
        })) > 0
        ) {
          // throw new BadRequestException(
          //   VALIDATION_MESSAGES.OrdersPendingToClose.key,
          // );
          throw new BadRequestException(
            VALIDATION_MESSAGES.TableStarted,
          );
        } else {
          await this.tableLogModel.findOneAndUpdate(
            {
              tableId: tableId,
              closingTime: null,
              status: TableLogStatus.Open
            },
            {
              closingTime: new Date(),
              status: TableLogStatus.Closed
            }
          );
        }
      }
      // await session.commitTransaction();
      // session.endSession();
    } else {
      await table.populate([{ path: 'currentTableLog' }]);
      if (!table.currentTableLog) {
        await this.tableService.update(tableId, {
          status: TableStatus.Empty,
          currentTableLog: null,
        });
        throw new BadRequestException(VALIDATION_MESSAGES.TableNotStarted.key);
      }
      if (
        (await this.orderModel.count({
          paymentStatus: OrderPaymentStatus.NotPaid,
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.Closed,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
          tableId: table.currentTableLog.tableId,
          _id: { $in: table.currentTableLog.orders },
        })) > 0
      ) {
        throw new BadRequestException(
          VALIDATION_MESSAGES.OrdersPendingToClose.key,
        );
      }

      await this.tableLogModel.findByIdAndUpdate(
        table.currentTableLog._id,
        {
          closingTime: new Date(),
          status: TableLogStatus.Closed
        });

      const checkLatestStatus = await this.tableLogModel.findById(table.currentTableLog._id);

      if (checkLatestStatus && checkLatestStatus?.status == TableLogStatus.Closed) {
        await this.tableService.update(tableId, {
          status: TableStatus.Empty,
          currentTableLog: null,
        });
      }

      tableLog = table.currentTableLog;


      // const session = await this.tableLogModel.startSession();
      // session.startTransaction();
      // table.currentTableLog.closingTime = new Date();
      // await table.currentTableLog.save();
      // await this.tableService.update(tableId, {
      //   status: TableStatus.Empty,
      //   currentTableLog: null,
      // });
      // tableLog = table.currentTableLog;
      // await session.commitTransaction();
      // session.endSession();
    }

    if (tableLog) {
      this.socketGateway.emit(
        req.user.supplierId?.toString(),
        SocketEvents.TableDashboard,
        tableLog.toObject(),
      );
    }

    return tableLog;
  }

  async closeAllTableLogs(req, tableId) {
    const tableLogData = await this.tableLogModel.find({
      supplierId: req.user.supplierId,
      tableId: tableId,
      status: TableLogStatus.Open
    });
    if (tableLogData) {
      await this.tableLogModel.updateMany(
        {
          tableId: tableId,
          status: TableLogStatus.Open,
          $not: {
            'orders': {
              $elemMatch: {
                paymentStatus: { $ne: OrderPaymentStatus.Paid },
                status: {
                  $in: [
                    OrderStatus.Cancelled,
                    OrderStatus.Closed,
                    OrderStatus.CancelledByMerge,
                    OrderStatus.CancelledWihPaymentFailed,
                  ],
                },
              }
            }
          }
        },
        {
          $set: {
            closingTime: new Date(),
            status: TableLogStatus.Closed,
          },
        }
      );

      // If any Order open without paid in this table
      const openTableLogsOrder = await this.tableLogModel.find({
        tableId: tableId,
        status: TableLogStatus.Open,
      }).populate({
        path: 'orders',
        match: {
          paymentStatus: {
            $in: [
              OrderPaymentStatus.NotPaid,
              OrderPaymentStatus.Pending
            ]
          }, status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.Closed,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          }
        },
      });
      if (openTableLogsOrder && openTableLogsOrder?.length > 0) {
        return openTableLogsOrder;
      }
      else {
        await this.tableService.update(tableId, {
          status: TableStatus.Empty,
          currentTableLog: null,
        });

        this.socketGateway.emit(
          req.user.supplierId?.toString(),
          SocketEvents.TableDashboard,
          tableLogData
        );

      }
    }
  }

  async itemsReadyToServe(req, query: QueryReadyToServeItemsDto) {
    let waiterQuery = {};
    if (req.user.isWaiter) {
      waiterQuery = { waiterId: req.user.userId };
    }
    const orders = await this.orderModel
      .find({
        ...query,
        ...waiterQuery,
        supplierId: req.user.supplierId,
        'items.preparationStatus': PreparationStatus.DonePreparing,
        orderType: OrderType.DineIn,
      })
      .populate([
        {
          path: 'tableId',
        },
        {
          path: 'items.kitchenQueueId',
        },
      ]);
    const response = [];
    for (const i in orders) {
      const tableIndex = response.findIndex(
        (r) => r._id.toString() == orders[i].tableId._id.toString(),
      );
      let table = response[tableIndex];
      if (!table) {
        table = { ...orders[i].tableId.toObject(), kitchenQueues: [] };
      }
      const orderObj = orders[i].toObject();

      orders[i].items.forEach((oi) => {
        if (oi.preparationStatus == PreparationStatus.DonePreparing) {
          let kitchenQueueObj = {
            _id: 'undefined',
            name: 'undefined',
          };
          if (oi.kitchenQueueId) {
            kitchenQueueObj = oi.kitchenQueueId.toObject();
          }
          const kitchenQueueIndex = table.kitchenQueues.findIndex(
            (k) => k._id.toString() == kitchenQueueObj._id.toString(),
          );
          let kitchenQueue = table.kitchenQueues[kitchenQueueIndex];
          if (!kitchenQueue) {
            kitchenQueue = { ...kitchenQueueObj, orders: [] };
          }

          const orderIndex = kitchenQueue.orders.findIndex(
            (o) => o._id.toString() == orders[i]._id.toString(),
          );
          let order = kitchenQueue.orders[orderIndex];
          if (!order) {
            order = { ...orderObj, tableId: orderObj.tableId._id, items: [] };
          }
          order.items.push({
            ...oi.toObject(),
            kitchenQueueId: oi.kitchenQueueId?._id,
          });

          if (orderIndex > -1) {
            kitchenQueue.orders[orderIndex] = order;
          } else {
            kitchenQueue.orders.push(order);
          }

          if (kitchenQueueIndex > -1) {
            table.kitchenQueues[kitchenQueueIndex] = kitchenQueue;
          } else {
            table.kitchenQueues.push(kitchenQueue);
          }
        }
      });

      if (tableIndex > -1) {
        response[tableIndex] = table;
      } else {
        response.push(table);
      }
    }

    return response;
  }

  async updateLog(
    tableId: string,
    dto: TableLogDto,
  ): Promise<TableLogDocument> {
    const table = await this.tableModel.findById(tableId);

    const tableLog = await this.tableLogModel.findByIdAndUpdate(
      table?.currentTableLog,
      dto,
      {
        new: true,
      },
    );

    if (!tableLog) {
      throw new NotFoundException(VALIDATION_MESSAGES.TableNotStarted.key);
    }

    this.socketGateway.emit(
      tableLog.supplierId.toString(),
      SocketEvents.TableLog,
      tableLog.toObject(),
    );
    //demo

    return tableLog;
  }
}
