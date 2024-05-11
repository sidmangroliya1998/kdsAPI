import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Table, TableDocument } from './schemas/table.schema';
import mongoose, {
  AggregatePaginateModel,
  AggregatePaginateResult,
  Model,
  PaginateModel,
  PaginateResult,
} from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { QuerySingleTableDto, QueryTableDto } from './dto/query-table.dto';
import { TableLog, TableLogDocument } from './schemas/table-log.schema';
import {
  OrderPaymentStatus,
  OrderStatus,
  PreparationStatus,
} from 'src/order/enum/en.enum';
import { TableLogDto } from './dto/table-log.dto';
import { TableStatus } from './enum/en.enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { match } from 'assert';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import { LeanDocument } from 'mongoose';
import { List, ListDocument } from 'src/list/schemas/list.schema';

@Injectable()
export class TableService {
  constructor(
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
    @InjectModel(Table.name)
    private readonly tableModelPag: AggregatePaginateModel<TableDocument>,
    @InjectModel(TableLog.name)
    private readonly tableLogModel: Model<TableLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(List.name)
    private readonly listModel: Model<ListDocument>,
  ) { }

  async create(req: any, dto: CreateTableDto): Promise<TableDocument> {
    return await this.tableModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
    });
  }

  async findAll(
    req: any,
    query: QueryTableDto,
    paginateOptions: PaginationDto,
  ): Promise<AggregatePaginateResult<TableDocument>> {
    if (query.restaurantId) {
      query.restaurantId = new mongoose.Types.ObjectId(query.restaurantId);
    }
    if (query.tableRegionId) {
      query.tableRegionId = new mongoose.Types.ObjectId(query.tableRegionId);
    }

    let allTableRegionIds = [];

    let deletedTable: any = {};

    if (req.query.deletedData && req.query.deletedData == 'Yes') {
      //ONLY DELETED
      const allTableRegion = await this.listModel.find({
        supplierId: req.user.supplierId,
        deletedAt: { $ne: null }
      });

      allTableRegionIds = allTableRegion.map((o) => o._id);
      deletedTable = {
        $or: [
          { deletedAt: { $ne: null } },
          { tableRegionId: { $in: allTableRegionIds } }
        ]
      };
    }
    else if (req.query.deletedData && req.query.deletedData == 'Both') {
      // BOTH
      const allTableRegion = await this.listModel.find({
        supplierId: req.user.supplierId
      });

      allTableRegionIds = allTableRegion.map((o) => o._id);

      deletedTable = { tableRegionId: { $in: allTableRegionIds } }
    }
    else {
      //ONLY ACTIVE
      const allTableRegion = await this.listModel.find({
        supplierId: req.user.supplierId,
        deletedAt: null
      });
      allTableRegionIds = allTableRegion.map((o) => o._id);

      deletedTable = { deletedAt: null, tableRegionId: { $in: allTableRegionIds } }
    }

    return await this.tableModelPag.aggregatePaginate(
      this.tableModelPag.aggregate(
        [
          {
            $match: {
              supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
              ...query,
              ...deletedTable,
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
            $lookup: {
              from: 'users',
              localField: 'currentTableLog.waiterId',
              foreignField: '_id',
              as: 'waiter',
            },
          },
          {
            $lookup: {
              from: "lists", // Assuming the name of your table region collection
              localField: "tableRegionId",
              foreignField: "_id",
              as: "tableRegion",
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
              waiter: {
                $cond: {
                  if: { $eq: [{ $size: '$waiter' }, 1] },
                  then: { $arrayElemAt: ['$waiter', 0] },
                  else: null,
                },
              },
            },
          },
          {
            $addFields: {
              'currentTableLog.waiterName': '$waiter.name',
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
              orderItems: {
                $map: {
                  input: '$orders',
                  as: 'order',
                  in: {
                    items: {
                      $size: {
                        $filter: {
                          input: '$$order.items',
                          as: 'item',
                          cond: {
                            $eq: [
                              '$$item.preparationStatus',
                              PreparationStatus.DonePreparing,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
              servedOrderItems: {
                $map: {
                  input: '$orders',
                  as: 'order',
                  in: {
                    items: {
                      $size: {
                        $filter: {
                          input: '$$order.items',
                          as: 'item',
                          cond: {
                            $eq: [
                              '$$item.preparationStatus',
                              PreparationStatus.OnTable,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
              pendingOrderItems: {
                $map: {
                  input: '$orders',
                  as: 'order',
                  in: {
                    items: {
                      $size: {
                        $filter: {
                          input: '$$order.items',
                          as: 'item',
                          cond: {
                            $in: [
                              '$$item.preparationStatus',
                              [
                                PreparationStatus.NotStarted,
                                PreparationStatus.StartedPreparing,
                              ],
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
              newOrders: {
                $size: {
                  $filter: {
                    input: '$orders',
                    cond: { $eq: ['$$this.status', OrderStatus.New] },
                  },
                },
              },
              processingOrders: {
                $size: {
                  $filter: {
                    input: '$orders',
                    cond: {
                      $in: [
                        '$$this.status',
                        [
                          OrderStatus.SentToKitchen,
                          OrderStatus.StartedPreparing,
                          OrderStatus.DonePreparing,
                        ],
                      ],
                    },
                  },
                },
              },

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

              onTableOrders: {
                $size: {
                  $filter: {
                    input: '$orders',
                    cond: { $eq: ['$$this.status', OrderStatus.OnTable] },
                  },
                },
              },
            },
          },
          {
            $addFields: {
              totalPaid: { $sum: '$activeOrders.summary.totalPaid' },
              total: { $sum: '$activeOrders.summary.totalWithTax' },
              remianingAmount: {
                $sum: '$activeOrders.summary.remainingAmountToCollect',
              },
              itemsReadyToPickup: { $sum: '$orderItems.items' },
              itemsServed: { $sum: '$servedOrderItems.items' },
              itemsPending: { $sum: '$pendingOrderItems.items' },
              isDeletedRegion: { $cond: { if: { $ne: ["$tableRegion.deletedAt", null] }, then: true, else: false } }
            },
          },
          {
            $project: {
              orders: 0,
              orderItems: 0,
              servedOrderItems: 0,
              pendingOrderItems: 0,
              waiter: 0,
            },
          },
        ],
        { allowDiskUse: true },
      ),
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy]: paginateOptions.sortDirection
              ? paginateOptions.sortDirection
              : -1,
          }
          : DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
  }

  async findOne(
    req: any,
    tableId: string,
    query: QuerySingleTableDto,
  ): Promise<LeanDocument<TableDocument>> {
    let orderQuery: any = {};
    if (query.paymentStatus) {
      orderQuery.paymentStatus = { $in: query.paymentStatus };
    }
    if (query.status) {
      orderQuery.status = { $in: query.status };
    }
    const exists: any = await this.tableModel
      .findById(tableId)
      .populate([
        { path: 'restaurantId', select: { name: 1, nameAr: 1 } },
        {
          path: 'currentTableLog',
        },
      ])
      .lean();

    if (!exists) {
      throw new NotFoundException();
    }

    if (exists.currentTableLog && exists.currentTableLog.orders.length > 0) {
      let getAllRest: any = [];
      if (req.user.userId && req.user.userId != '') {
        getAllRest = await this.userModel.findById(req.user.userId);
      }

      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        orderQuery.restaurantId = {
          $in: getAllRest?.restaurantId
        };
      }
      exists.currentTableLog.orders = await this.orderModel.find({
        _id: { $in: exists.currentTableLog.orders },
        ...orderQuery,
      }).populate([
        {
          path: 'restaurantId',
          select: { name: 1, nameAr: 1 }
        }]
      ).sort({ _id: -1 });
      exists.total = 0;
      exists.totalPaid = 0;
      exists.remianingAmount = 0;
      exists.currentTableLog.orders.forEach((o) => {
        if (
          [
            OrderStatus.New,
            OrderStatus.SentToKitchen,
            OrderStatus.StartedPreparing,
            OrderStatus.DonePreparing,
            OrderStatus.OnTable,
            OrderStatus.Closed,
          ].includes(o.status)
        ) {
          exists.total += o.summary.totalWithTax;
          exists.totalPaid += o.summary.totalPaid;
          exists.remianingAmount += o.summary.remainingAmountToCollect;
        }
      });
    }

    return exists;
  }

  async update(
    tableId: string,
    dto: UpdateTableDto | any,
  ): Promise<TableDocument> {
    const table = await this.tableModel.findByIdAndUpdate(tableId, dto, {
      new: true,
    });

    if (!table) {
      throw new NotFoundException();
    }

    return table;
  }

  async remove(tableId: string): Promise<boolean> {
    const table = await this.tableModel.findByIdAndUpdate(
      tableId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!table) {
      throw new NotFoundException();
    }
    return true;
  }
}
