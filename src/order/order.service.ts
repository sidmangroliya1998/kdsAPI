import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ChangeOrderDto,
  MarketPlaceStatusDto,
  UpdateOrderDto,
} from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';

import { CalculationService } from './calculation.service';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import {
  QueryCustomerOrderDto,
  QueryKitchenDisplayDto,
  QueryManualShishaUpdateDto,
  QueryOrderDto,
  RemoveCashOrder,
} from './dto/query-order.dto';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import {
  DeliveryStatus,
  InvoiceStatus,
  OrderActionTypeHistory,
  OrderPaymentStatus,
  OrderStatus,
  OrderType,
  PreparationStatus,
} from './enum/en.enum';
import { Table, TableDocument } from 'src/table/schemas/table.schema';
import {
  getRandomTime,
  roundOffNumber,
} from 'src/core/Helpers/universal.helper';
import { MoveOrderItemDto } from './dto/move-order.dto';
import { GroupOrderDto } from './dto/group-order.dto';
import { KitchenQueueProcessDto } from './dto/kitchen-queue-process.dto';
import {
  KitchenQueue,
  KitchenQueueDocument,
} from 'src/kitchen-queue/schemas/kitchen-queue.schema';
import { InvoiceService } from 'src/invoice/invoice.service';
import { InvoiceHelperService } from 'src/invoice/invoice-helper.service';
import {
  CalculationType,
  OrderTypes,
  PaymentStatus,
} from 'src/core/Constants/enum';
import * as moment from 'moment';
import 'moment-timezone';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { ExpoPushNotificationService } from 'src/notification/expo-push-notification.service';
import { Printer, PrinterDocument } from 'src/printer/schema/printer.schema';
import { QueryIdentifyPrinterDto } from './dto/query-identify-printer.dto';
import { PrinterType } from 'src/printer/enum/en';
import { Cashier, CashierDocument } from 'src/cashier/schemas/cashier.schema';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { ObjectId } from 'mongoose';
import { TableHelperService } from 'src/table/table-helper.service';
import { CashierHelperService } from '../cashier/cashier-helper.service';
import {
  DeferredTransaction,
  DeferredTransactionDocument,
} from './schemas/deferred-transaction.schema';
import { AdhocDiscountDto, DiscountOrderDto } from './dto/discount-order.dto';
import {
  Transaction,
  TransactionDocument,
} from 'src/transaction/schemas/transactions.schema';
import { Invoice, InvoiceDocument } from 'src/invoice/schemas/invoice.schema';
import { ChangeDeliveryStatusDto } from './dto/change-delivery-status.dto';
import { DriverReportDto } from './dto/driver-report.dto';
import { Workbook } from 'exceljs';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { CacheService } from 'src/cache/cache.service';
import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { FeedUsService } from 'src/core/Providers/http-caller/feed-us.service';
import {
  CashierLog,
  CashierLogDocument,
} from 'src/cashier/schemas/cashier-log.schema';
import { MassActionDto, MassCancelDto } from './dto/mass-action.dto';
import { TableLog, TableLogDocument } from 'src/table/schemas/table-log.schema';
import { CacheDataService } from 'src/cache/cache-data.service';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { OrderHelperService } from './order-helper.service';
import { MenuCategory, MenuCategoryDocument } from 'src/menu/schemas/menu-category.schema';
import { Batch, BatchDocument } from 'src/batch/schemas/batch.schema';
import { BatchAction } from 'src/batch/enum/en';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Order.name)
    private readonly orderModelPag: PaginateModel<OrderDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
    @InjectModel(TableLog.name)
    private readonly tableLogModel: Model<TableLogDocument>,
    @InjectModel(KitchenQueue.name)
    private readonly kitchenQueueModel: Model<KitchenQueueDocument>,
    @Inject(forwardRef(() => OrderHelperService))
    private readonly orderHelperService: OrderHelperService,
    @Inject(forwardRef(() => CalculationService))
    private readonly calculationService: CalculationService,
    @Inject(forwardRef(() => InvoiceHelperService))
    private readonly invoiceHelperService: InvoiceHelperService,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Printer.name)
    private readonly printerModel: Model<PrinterDocument>,
    @InjectModel(Cashier.name)
    private readonly cashierModel: Model<CashierDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(DeferredTransaction.name)
    private readonly deferredTransactionModel: Model<DeferredTransactionDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    private readonly tableHelperService: TableHelperService,
    private readonly cashierHelperService: CashierHelperService,
    private readonly cacheService: CacheService,
    private readonly cacheDataService: CacheDataService,
    private socketGateway: SocketIoGateway,
    private readonly feedusService: FeedUsService,
    @InjectModel(CashierLog.name)
    private readonly cashierLogModel: Model<CashierLogDocument>,
    @InjectModel(Batch.name)
    private readonly batchModel: Model<BatchDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateOrderDto,
    isDryRun = false,
    isFromDynamicPrice = false,
  ): Promise<OrderDocument> {
    const orderData: any = { ...dto, isDryRun };

    //console.log(`1 -- ${new Date()} -- ${new Date().getMilliseconds()}`);

    let supplier = await this.cacheService.get(req.user.supplierId.toString());
    if (!supplier) {
      supplier = await this.supplierModel.findById(req.user.supplierId).lean();
      await this.cacheService.set(supplier._id.toString(), supplier);
    }
    // console.log(`2 -- ${new Date()} -- ${new Date().getMilliseconds()}`);
    if ([OrderType.Delivery, OrderType.Pickup].includes(dto.orderType)) {
      //console.log(supplier);
      let workingHours = [supplier.defaultWorkingHours];
      // console.log(workingHours);
      if (supplier.overrideWorkingHours?.length > 0) {
        workingHours = supplier.overrideWorkingHours.filter((workingHour) => {
          return (
            workingHour.day ==
            moment()
              .tz(supplier.timezone ?? TIMEZONE)
              .format('dddd')
          );
        });
        // console.log(workingHours);
        if (workingHours.length == 0) {
          workingHours = [supplier.defaultWorkingHours];
        }
      }
      //console.log(workingHours);
      if (workingHours.length > 0) {
        const matchedPeriod = workingHours.find((workingHour) => {
          if (workingHour.start == workingHour.end) return true;
          const startArr = workingHour.start.split(':');
          const endArr = workingHour.end.split(':');

          if (
            startArr.length == 2 &&
            endArr.length == 2 &&
            parseInt(startArr[0]) == parseInt(endArr[0]) &&
            parseInt(startArr[1]) == parseInt(endArr[1])
          ) {
            return true;
          }

          const startDate = moment()
            .tz(supplier.timezone ?? TIMEZONE)
            .set({
              hour: startArr.length == 2 ? parseInt(startArr[0]) : 0,
              minute: startArr.length == 2 ? parseInt(startArr[1]) : 0,
            });

          const endDate = moment()
            .tz(supplier.timezone ?? TIMEZONE)
            .set({
              hour: endArr.length == 2 ? parseInt(endArr[0]) : 0,
              minute: endArr.length == 2 ? parseInt(endArr[1]) : 0,
            });

          const currentDate = moment().tz(supplier.timezone ?? TIMEZONE);
          if (endDate.isBefore(startDate)) {
            // special case where end date is less than start date so we need to  adjust the date
            if (currentDate.isBefore(startDate)) {
              // after 00:00
              startDate.subtract(24, 'hours'); // we need to subtract because startdate is becoming bext date after 00:00
            } else {
              // before 00:00
              endDate.add(24, 'hours'); // we need to add because end hours / mins are less than start hours and / mins
            }
          }
          // console.log(currentDate, startDate, endDate);
          if (
            currentDate.isSameOrAfter(startDate) &&
            currentDate.isSameOrBefore(endDate)
          ) {
            return true;
          }
        });
        if (!matchedPeriod) {
          throw new BadRequestException(
            VALIDATION_MESSAGES.RestaurantClosed.key,
          );
        }
      }
    }

    if (dto.orderType == OrderType.DineIn) {
      if (!req.user.isCustomer) orderData.waiterId = req.user.userId;
    }
    orderData.taxRate = supplier.taxRate ?? 15;

    orderData.feeRate = supplier.feeRate ?? 0;

    if (orderData.isScheduled != true) {
      delete orderData.scheduledDateTime;
    }
    //console.log(`3 -- ${new Date()} -- ${new Date().getMilliseconds()}`);
    // check for kitchen queue
    if (!orderData.kitchenQueueId) {
      let kitchenQueue = await this.cacheService.get(
        orderData.restaurantId.toString() + '_defaultKitchenQueue',
      );
      if (!kitchenQueue) {
        kitchenQueue = await this.kitchenQueueModel
          .findOne({
            restaurantId: orderData.restaurantId,
            default: true,
          })
          .lean();
        if (kitchenQueue)
          await this.cacheService.set(
            orderData.restaurantId.toString() + '_defaultKitchenQueue',
            kitchenQueue,
          );
      }
      if (kitchenQueue) orderData.kitchenQueueId = kitchenQueue._id;
    }
    // console.log(`4 -- ${new Date()} -- ${new Date().getMilliseconds()}`);
    // console.log('Kitchen Queue', orderData.kitchenQueueId);
    orderData.supplierId = supplier._id;
    // prepare the order items
    if (orderData.items && orderData.items.length > 0)
      orderData.items = await this.orderHelperService.prepareOrderItems(
        orderData,
        isFromDynamicPrice,
      );
    else {
      orderData.items = [];
    }

    // prepare the bundle items
    if (orderData.bundles && orderData.bundles.length > 0)
      orderData.bundles = await this.orderHelperService.prepareBundleItems(
        orderData,
        isFromDynamicPrice,
      );
    else {
      orderData.bundles = [];
    }

    // console.log(`5 -- ${new Date()} -- ${new Date().getMilliseconds()}`);

    orderData.tableFee = {
      fee: 0,
      netBeforeTax: 0,
      tax: 0,
    };

    if (orderData.orderType == OrderType.DineIn) {
      let table = await this.cacheService.get(orderData.tableId);
      if (!table) {
        table = await this.tableModel.findById(orderData.tableId).lean();
        if (table) await this.cacheService.set(orderData.tableId, table);
      }
      if (!table)
        throw new NotFoundException(VALIDATION_MESSAGES.TableNotFound.key);
      const tableFee = table.fees ?? 0;
      const netBeforeTax = supplier.taxEnabledOnTableFee
        ? tableFee / (1 + orderData.taxRate / 100)
        : tableFee;
      const tax = supplier.taxEnabledOnTableFee
        ? (netBeforeTax * orderData.taxRate) / 100
        : 0;
      orderData.tableFee = {
        fee: roundOffNumber(tableFee),
        netBeforeTax: roundOffNumber(netBeforeTax),
        tax: roundOffNumber(tax),
      };
      orderData.sittingStartTime = dto.menuQrCodeScannedTime ?? null;
    }
    //console.log(`6 -- ${new Date()} -- ${new Date().getMilliseconds()}`);

    // calculate summary
    orderData.summary = await this.calculationService.calculateSummery(
      orderData,
    );
    //console.log(`7 -- ${new Date()} -- ${new Date().getMilliseconds()}`);

    if (orderData.scheduledDateTime == null) {
      delete orderData.scheduledDateTime;
    }

    // orderData.preparationDetails =
    //   await this.calculationService.calculateOrderPreparationTiming(orderData);

    if (isDryRun) {
      this.orderHelperService.storeCart(orderData);
      //console.log(`8 -- ${new Date()} -- ${new Date().getMilliseconds()}`);
      return orderData;
    }
    console.log("Generate Order Number");

    orderData.orderNumber = await this.orderHelperService.generateOrderNumber(
      supplier._id,
      dto.restaurantId,
      dto.date ? dto.date?.toString() : ""
    );



    // set last order number in cache
    await this.cacheService.set(
      supplier._id.toString() + '_lastOrderNumber',
      orderData.orderNumber,
    );


    if (orderData.summary?.couponCode && orderData.summary?.couponCode != '') {
      orderData.couponCode = orderData.summary?.couponCode;
    }

    console.log("Create Order");
    const momentObject = moment.utc(moment()).tz(TIMEZONE);

    // console.log("momentObject", momentObject);
    // console.log("momentObject2", momentObject?.toDate());
    // console.log("momentObject 3 ", new Date(momentObject?.toString()));

    let orderHistrory = [
      {
        userId: req.user.userId ?? null,
        action: OrderActionTypeHistory.Created,
        actionAt: new Date(),
      }];
    // create order
    console.log("Create Order start");

    if (dto.date) {
      orderData.createdAt = new Date(dto.date);
      orderData.createdAt.setUTCHours(23);
      orderData.createdAt.setUTCMinutes(59);
    }
    console.log("orderData.createdAt", orderData.createdAt);
    try {
      const order = await this.orderModel.create({
        ...orderData,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId ?? null,
        orderActionHistory: orderHistrory
      });      
      // post order create
      this.orderHelperService.postOrderCreate(req, order);
      return order;
    } catch (error) {
      console.log("err", error);
    }
    return null;
  }

  async dateRangeCalculator(req) {
    const response = [];
    for (let i = 0; i < 99; i++) {
      const start = getRandomTime();
      const end = getRandomTime();
      const current = getRandomTime();
      const startArr = start.split(':');
      const endArr = end.split(':');
      const currentArr = current.split(':');
      const res = {
        start,
        end,
        current,
        result: false,
      };
      if (
        startArr.length == 2 &&
        endArr.length == 2 &&
        parseInt(startArr[0]) == parseInt(endArr[0]) &&
        parseInt(startArr[1]) == parseInt(endArr[1])
      ) {
        res.result = true;
      }

      const startDate = moment()
        .tz(TIMEZONE)
        .set({
          hour: startArr.length == 2 ? parseInt(startArr[0]) : 0,
          minute: startArr.length == 2 ? parseInt(startArr[1]) : 0,
        });

      const endDate = moment()
        .tz(TIMEZONE)
        .set({
          hour: endArr.length == 2 ? parseInt(endArr[0]) : 0,
          minute: endArr.length == 2 ? parseInt(endArr[1]) : 0,
        });
      const currentDate = moment()
        .tz(TIMEZONE)
        .set({
          hours: currentArr.length == 2 ? parseInt(currentArr[0]) : 0,
          minutes: currentArr.length == 2 ? parseInt(currentArr[1]) : 0,
        });
      if (endDate.isBefore(startDate)) {
        // special case where end date is less than start date so we need to  adjust the date
        if (currentDate.isBefore(startDate)) {
          // after 00:00
          startDate.subtract(24, 'hours'); // we need to subtract because startdate is becoming bext date after 00:00
        } else {
          // before 00:00
          endDate.add(24, 'hours'); // we need to add because end hours / mins are less than start hours and / mins
        }
      }
      console.log(currentDate, startDate, endDate);
      if (
        currentDate.isSameOrAfter(startDate) &&
        currentDate.isSameOrBefore(endDate)
      ) {
        res.result = true;
      }
      response.push(res);
    }
    return response;
  }

  async findAll(
    req: any,
    query: QueryOrderDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    let queryToApply: any = { ...query };
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (!query.restaurantId || query.restaurantId == '') {
      const getAllRest = await this.userModel.findById(req.user.userId);
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.restaurantId = {
          $in: getAllRest?.restaurantId
        };
      }
    }
    if (query.cashierLogIds && query.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = { $in: query.cashierLogIds };
    }
    if (query.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (query.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (query.menuItemIds && query.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = { $in: query.menuItemIds };
    }

    if (query.search) {
      queryToApply.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { contactNumber: { $regex: query.search, $options: 'i' } },
        { orderNumber: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.groupId) {
      const allOrders = await this.orderModel.find({
        supplierId: req.user.supplierId,
        orderNumber: { $regex: query.groupId, $options: 'i' }
      });
      queryToApply.groupId = { $in: allOrders.map((o) => o._id) };
    }

    if (query.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }
    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);
      query.startDate = new Date(
        query.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(59);
      query.endDate = new Date(
        query.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );

      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (paginateOptions.pagination == false) {
      paginateOptions = {
        pagination: true,
        limit: 900,
        page: 1,
      };
    }
    if (query.paymentMethod) {
      const transactions = await this.transactionModel.find({
        supplierId: req.user.supplierId,
        paymentMethod: query.paymentMethod,
        createdAt: {
          $gte: query.startDate,
          $lte: query.endDate,
        }
      });
      const transactionIds = transactions.map(transaction => transaction._id);
      queryToApply.transactions = { $in: transactionIds }
      delete queryToApply.paymentMethod;
    }

    // console.log("queryToApply", queryToApply);


    const orders = await this.orderModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        ...queryToApply,
      },
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
        populate: [
          { path: 'restaurantId', select: { name: 1, nameAr: 1 } },
          { path: 'customerId' },
          { path: 'waiterId' },
          { path: 'driverId' },
          { path: 'tableId', select: { name: 1, nameAr: 1 } },
          { path: 'kitchenQueueId', select: { name: 1, nameAr: 1 } },
          { path: 'receipts', select: { imageUrl: 1 } },
          { path: 'invoices', select: { imageUrl: 1 } },
          {
            path: 'glVoucherId',
            select: {
              voucherNumber: 1
            }
          },
          { path: 'addedBy', select: { name: 1, _id: 1 } },
          { path: 'paymentCollectedBy', select: { name: 1, _id: 1 } },
          { path: 'refundedBy', select: { name: 1, _id: 1 } },
          { path: 'deferredBy', select: { name: 1, _id: 1 } },
          { path: 'cancelledBy', select: { name: 1, _id: 1 } },
          { path: 'orderActionHistory.userId', select: { name: 1, _id: 1 } },
          { path: 'groupId', select: { orderNumber: 1, _id: 1 } }
        ],
      },
    );
    return orders;
  }

  async kitchenDashboard(req: any, query: QueryKitchenDisplayDto) {
    const queryToApply: any = { ...query };
    const user = await this.userModel.findById(req.user.userId);
    if (user && user.kitchenQueue) {
      queryToApply['items.kitchenQueueId'] = user.kitchenQueue;
      queryToApply['items.preparationStatus'] = {
        $in: [PreparationStatus.NotStarted, PreparationStatus.StartedPreparing],
      };
    }
    const totalOrders = await this.orderModel.count({
      restaurantId: query.restaurantId,
      supplierId: req.user.supplierId,
      groupId: null,
      ...queryToApply,
      status: {
        $in: [OrderStatus.SentToKitchen, OrderStatus.StartedPreparing],
      },
    });

    const activeOrders = await this.orderModel.count({
      restaurantId: query.restaurantId,
      supplierId: req.user.supplierId,
      groupId: null,
      ...queryToApply,
      status: {
        $in: [OrderStatus.StartedPreparing],
      },
    });

    const priorityOrdersRes = await this.orderModel.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(query.restaurantId),
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          groupId: null,
          ...queryToApply,
          status: {
            $in: [OrderStatus.StartedPreparing],
          },
        },
      },
      {
        $project: {
          orders: {
            $size: {
              $filter: {
                input: '$preparationDetails',
                as: 'p',
                cond: {
                  $gte: [
                    {
                      $dateAdd: {
                        startDate: '$$p.actualStartTime',
                        unit: 'minute',
                        amount: '$$p.preparationTime',
                      },
                    },
                    new Date(),
                  ],
                },
              },
            },
          },
        },
      },
    ]);
    const priorityOrders =
      priorityOrdersRes && priorityOrdersRes.length > 0
        ? priorityOrdersRes[0].orders
        : 0;

    return { totalOrders, activeOrders, priorityOrders };
  }

  async kitchenDisplay(
    req: any,
    query: QueryKitchenDisplayDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    const queryToApply: any = { ...query };

    const user = await this.userModel.findById(req.user.userId);
    if (user && user.kitchenQueue) {
      queryToApply['items.kitchenQueueId'] = user.kitchenQueue;
      queryToApply['items.preparationStatus'] = {
        $in: [PreparationStatus.NotStarted, PreparationStatus.StartedPreparing],
      };

      queryToApply['bundles.bundleSubGroups.items.kitchenQueueId'] = user.kitchenQueue;
      queryToApply['bundles.bundleSubGroups.items.preparationStatus'] = {
        $in: [PreparationStatus.NotStarted, PreparationStatus.StartedPreparing],
      };
    }

    if (paginateOptions.pagination == false) {
      paginateOptions = {
        pagination: true,
        limit: 10,
        page: 1,
      };
    }
    const orders = await this.orderModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        groupId: null,
        ...queryToApply,
        status: {
          $in: [OrderStatus.SentToKitchen, OrderStatus.StartedPreparing],
        },
      },
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
        populate: [
          { path: 'restaurantId', select: { name: 1, nameAr: 1 } },
          { path: 'customerId', select: { name: 1 } },
          { path: 'waiterId', select: { name: 1 } },
          { path: 'tableId', select: { name: 1, nameAr: 1 } },
          { path: 'kitchenQueueId', select: { name: 1, nameAr: 1 } },
          { path: 'driverId' },
        ],
      },
    );

    orders.docs.forEach((d) => {
      d.items = d.items.filter((di) => {
        if (user && user.kitchenQueue) {
          if (
            di.kitchenQueueId.toString() == user.kitchenQueue.toString() &&
            di.isGrouped == false
          )
            return true;
        } else {
          if (di.isGrouped == false) return true;
        }
      });

      d.bundles = d.bundles.filter((di) => {
        if (user && user.kitchenQueue) {
          di.bundleSubGroups = di.bundleSubGroups.filter((b) => {
            b.items = b.items.filter(
              (i) =>
                i.kitchenQueueId.toString() == user.kitchenQueue.toString(),
            );
            if (b.items && b.items.length > 0) return true;
          });
          if (di.bundleSubGroups && di.bundleSubGroups.length > 0) return true;
        }
      });
    });

    return orders;
  }

  async findByCustomer(
    req: any,
    query: QueryCustomerOrderDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    const queryToApply: any = { ...query };
    if (query.search) {
      queryToApply.$or = [
        { orderNumber: { $regex: query.search, $options: 'i' } },
      ];
    }
    const orders = await this.orderModelPag.paginate(
      {
        ...queryToApply,
        $or: [
          {
            customerId: req.user.userId,
          },
          {
            addedBy: req.user.userId,
          },
        ],
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          { path: 'restaurantId', select: { name: 1, nameAr: 1 } },
          { path: 'customerId' },
          { path: 'waiterId', select: { name: 1 } },
          { path: 'tableId', select: { name: 1, nameAr: 1 } },
          { path: 'kitchenQueueId', select: { name: 1, nameAr: 1 } },
        ],
      },
    );
    return orders;
  }

  async findOne(orderId: string): Promise<OrderDocument> {
    const exists = await this.orderModel
      .findById(orderId)
      .populate([
        { path: 'restaurantId', select: { name: 1, nameAr: 1 } },
        { path: 'customerId' },
        { path: 'waiterId', select: { name: 1 } },
        { path: 'tableId', select: { name: 1, nameAr: 1 } },
        { path: 'driverId' },
        { path: 'kitchenQueueId', select: { name: 1, nameAr: 1 } },
      ]);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    req: any,
    orderId: string,
    dto: UpdateOrderDto,
    allowForceUpdate = false,
  ): Promise<OrderDocument> {
    //find existing order data

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException();
    }
    //creating new order object with existing data  + updated dto
    const orderData: any = { ...order.toObject(), ...dto };

    let supplier = await this.cacheService.get(req.user.supplierId.toString());
    if (!supplier) {
      supplier = await this.supplierModel.findById(req.user.supplierId).lean();
      await this.cacheService.set(supplier._id.toString(), supplier);
    }

    //if order is closed and not reset we do not allow them to update
    // if allowForceUpdate - it will by pass this condition
    if (
      order.status == OrderStatus.Closed &&
      dto.status != OrderStatus.Reset &&
      !allowForceUpdate
    ) {
      throw new BadRequestException(VALIDATION_MESSAGES.OrderClosed.key);
    } else if (
      dto.status == OrderStatus.Reset &&
      order.status != OrderStatus.Closed
    ) {
      throw new BadRequestException(`Not Allowed`);
    }

    //current status and existing order status should be match 
    if (dto.status && dto.status == order.status) {
      throw new BadRequestException(
        `${VALIDATION_MESSAGES.SameStatus.key}__${dto.status}`,
      );
    }

    //duration/event time update on events
    if (dto.status && dto.status == OrderStatus.SentToKitchen) {
      orderData.sentToKitchenTime = new Date();
    } else if (dto.status && dto.status == OrderStatus.OnTable) {
      orderData.orderReadyTime = new Date();
      let orderItemIds = orderData.items.map((oi) => oi._id.toString());
      if (dto.orderItemIds) {
        orderItemIds = dto.orderItemIds;

        delete orderData.status;
      }
      orderData.items.forEach((oi) => {
        if (orderItemIds.includes(oi._id.toString())) {
          oi.preparationStatus = PreparationStatus.OnTable;
        }
      });
    }

    // prepare the order items
    if (dto.items || dto.couponCode) {
      if (!dto.couponCode) orderData.couponCode = order.couponCode;

      orderData._id = order._id;

      if (orderData.items && orderData.items.length > 0) {
        orderData.feeRate = supplier.feeRate ?? 0;
        orderData.isShishaFeeApplicable = false;
        orderData.items = await this.orderHelperService.prepareOrderItems(
          orderData,
        );
      } else {
        orderData.items = [];
      }

      // prepare the bundle items
      if (orderData.bundles && orderData.bundles.length > 0)
        orderData.bundles = await this.orderHelperService.prepareBundleItems(
          orderData,
        );
      else {
        orderData.bundles = [];
      }

      //Calculate summary
      orderData.summary = await this.calculationService.calculateSummery(
        orderData,
      );
    }
    // handle payment status
    if (orderData.summary.totalPaid > 0) {
      if (
        orderData.summary.totalPaid >
        orderData.summary.totalWithTax + (orderData.tip ?? 0)
      ) {
        orderData.paymentStatus = OrderPaymentStatus.OverPaid;
      } else if (
        orderData.summary.totalPaid ==
        orderData.summary.totalWithTax + (orderData.tip ?? 0)
      ) {
        orderData.paymentStatus = OrderPaymentStatus.Paid;
      } else {
        orderData.paymentStatus = OrderPaymentStatus.NotPaid;
      }
    }
    let orderHistory: any = order.orderActionHistory;
    const momentObject = moment.utc(moment())
      .tz(TIMEZONE).format('DD/MM/yyyy hh:mm a');

    if (dto.status == OrderStatus.Cancelled) {
      orderData.cancelledBy = req?.user?.userId;
      orderHistory.push({
        userId: req.user.userId ?? null,
        action: OrderActionTypeHistory.Cancelled,
        actionAt: new Date(),
      })
      orderData.orderActionHistory = orderHistory;
    }

    if (dto.tableId && dto.tableId?.toString() != order.tableId?.toString()) {
      orderData.movedBy = req?.user?.userId;
      orderData.movedAt = new Date();
      orderData.movedFromTableId = order.tableId;
      orderData.movedToTableId = dto.tableId;
    }


    //updating the final data

    if (dto.tableId && dto.tableId?.toString() != order.tableId?.toString()) {

      orderHistory.push({
        userId: req.user.userId ?? null,
        action: OrderActionTypeHistory.MoveTable,
        actionAt: new Date(),
        fromDoc: order.tableId?.toString(),
        toDoc: dto.tableId?.toString()
      })
      orderData.movedBy = req?.user?.userId;
      orderData.movedAt = new Date();
      orderData.movedFromTableId = order.tableId;
      orderData.movedToTableId = dto.tableId;
      orderData.orderActionHistory = orderHistory;
    }

    const modified = await this.orderModel.findByIdAndUpdate(
      orderId,
      orderData,
      {
        new: true,
      },
    );

    //post order update
    this.orderHelperService.postOrderUpdate(modified, dto, order);

    return modified;
  }

  // async adhocDiscount(req, dto: AdhocDiscountDto) {

  // }

  async restrictedUpdate(
    req: any,
    orderId: string,
    dto: UpdateOrderDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({
      _id: orderId,
      status: OrderStatus.New,
      paymentStatus: OrderPaymentStatus.NotPaid,
    });

    if (!order) {
      throw new BadRequestException(`لايوجد لك الصلاحيات الازمة`);
    }
    return await this.update(req, orderId, dto);
  }

  async deferOrder(req, orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException();
    }
    // if (order.summary.totalPaid > 0) {
    //   throw new BadRequestException(
    //     `This order can not be deferred as some amount is already paid`,
    //   );
    // }
    await this.transactionModel.updateMany(
      { orderId: order._id },
      {
        $set: {
          status: PaymentStatus.Failed,
        },
      },
    );
    const cashierId = await this.cashierHelperService.resolveCashierId(
      req,
      null,
      true,
      order.restaurantId,
    );
    await this.deferredTransactionModel.create({
      supplierId: req.user.supplierId,
      restaurantId: order.restaurantId,
      orderId: order._id,
      cashierId,
      amount: order.summary.remainingAmountToCollect,
      addedBy: req.user.userId,
    });

    const momentObject = moment
      .utc(moment())
      .tz(TIMEZONE).format('DD/MM/yyyy hh:mm a');

    let orderHistory: any = order.orderActionHistory;

    orderHistory.push({
      userId: req.user.userId ?? null,
      action: OrderActionTypeHistory.Deferred,
      actionAt: new Date(),
    });
    const modified = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: OrderPaymentStatus.Deferred,
        status: OrderStatus.Closed,
        summary: {
          ...order.summary,
          totalPaid: 0,
          remainingAmountToCollect: order.summary.totalWithTax,
        },
        deferredBy: req.user.userId,
        orderActionHistory: orderHistory
      },
      {
        new: true,
      },
    );
    this.socketGateway.emit(order.supplierId.toString(), SocketEvents.Cashier, {
      cashierId: cashierId,
      refresh: true,
    });
    return modified;
  }

  async processMarketPlaceOrder(
    req,
    orderId: string,
    dto: MarketPlaceStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException();
    }

    const modified = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        ...dto,
      },
      {
        new: true,
      },
    );
    if (modified.feedusId) {
      this.feedusService.updateOrderStatus(modified);
    }
    return modified;
  }

  async groupOrders(req: any, dto: GroupOrderDto): Promise<OrderDocument> {
    const orders = await this.orderModel
      .find({
        _id: { $in: dto.orderIds },
        status: {
          $nin: [
            OrderStatus.Closed,
            OrderStatus.Cancelled,
            OrderStatus.CancelledByMerge,
            OrderStatus.CancelledWihPaymentFailed,
          ],
        },
      })
      .lean();
    if (orders.length < 2)
      throw new BadRequestException(VALIDATION_MESSAGES.AllOrderClosed.key);
    const tableIds = orders.map((v) => v.tableId);
    var uniqueTableIds = new Set(tableIds);
    if (tableIds.length != uniqueTableIds.size) {
      throw new BadRequestException(
        VALIDATION_MESSAGES.SameTableMergeNotAllowed.key,
      );
    }
    let items = [], bundles = [];
    orders.forEach((o) => {
      items = items.concat(o.items);
      bundles = bundles.concat(o.bundles);
    });

    const orderIds = orders.map((o) => o._id);

    let supplier = await this.cacheService.get(orders[0].supplierId.toString());
    if (!supplier) {
      supplier = await this.supplierModel.findById(orders[0].supplierId).lean();
      if (supplier)
        await this.cacheService.set(supplier._id.toString(), supplier);
    }
    const momentObject = moment
      .utc(moment())
      .tz(TIMEZONE).format('DD/MM/yyyy hh:mm a');

    let groupOrder: any = orders[0];
    groupOrder.items = items;
    groupOrder.bundles = bundles;
    delete groupOrder._id;
    delete groupOrder.createdAt;
    delete groupOrder.updatedAt;
    delete groupOrder.invoiceStatus;
    delete groupOrder.paymentStatus;
    groupOrder.isGrouped = true;

    groupOrder.transactions = [];

    const orderInKitchen = orders.find(
      (o) => o.status == OrderStatus.SentToKitchen,
    );

    if (orderInKitchen) {
      groupOrder.status = OrderStatus.SentToKitchen;
    }

    if (groupOrder.items && groupOrder.items.length > 0)
      groupOrder.items = await this.orderHelperService.prepareOrderItems(
        groupOrder,
      );
    else {
      groupOrder.items = [];
    }

    // prepare the bundle items
    if (groupOrder.bundles && groupOrder.bundles.length > 0)
      groupOrder.bundles = await this.orderHelperService.prepareBundleItems(
        groupOrder,
      );
    else {
      groupOrder.bundles = [];
    }

    groupOrder.summary.totalPaid = orders.reduce(
      (n, { summary }) => n + summary.totalPaid,
      0,
    );

    groupOrder.summary.totalRefunded = orders.reduce(
      (n, { summary }) => n + summary.totalRefunded,
      0,
    );

    groupOrder.summary = await this.calculationService.calculateSummery(
      groupOrder,
    );


    if (groupOrder.summary.totalPaid > 0) {
      if (
        groupOrder.summary.totalPaid >
        groupOrder.summary.totalWithTax + (groupOrder.tip ?? 0)
      ) {
        groupOrder.paymentStatus = OrderPaymentStatus.OverPaid;
      } else if (
        groupOrder.summary.totalPaid ==
        groupOrder.summary.totalWithTax + (groupOrder.tip ?? 0)
      ) {
        groupOrder.paymentStatus = OrderPaymentStatus.Paid;
      } else {
        groupOrder.paymentStatus = OrderPaymentStatus.NotPaid;
      }
    }

    groupOrder.orderNumber = await this.orderHelperService.generateOrderNumber(
      supplier._id,
      orders[0].restaurantId?.toString()
    );

    const transactions = await this.transactionModel.find({
      orderId: { $in: orderIds },
      status: PaymentStatus.Success,
    });


    const transactionIds = transactions.map((t) => t._id);
    groupOrder.transactions = transactionIds;
    groupOrder.mergedAt = new Date();
    groupOrder.mergedBy = req?.user?.userId;
    groupOrder.orderActionHistory = [
      {
        userId: req.user.userId ?? null,
        action: OrderActionTypeHistory.Created,
        actionAt: new Date(),
      }];

    const groupOrderObj = await this.orderModel.create(groupOrder);

    await this.orderHelperService.postOrderCreate(req, groupOrderObj);

    this.orderHelperService.generateKitchenReceipts(groupOrderObj, false);

    for (const i in orderIds) {
      this.update(req, orderIds[i], {
        status: OrderStatus.CancelledByMerge,
        groupId: groupOrderObj._id,
        mergedAt: new Date(),
        mergedBy: req?.user?.userId
      });

      const currentOrder = await this.orderModel.findById(orderIds[i]);

      let orderHistory: any = currentOrder.orderActionHistory;

      if (!orderHistory || orderHistory?.length == 0) {
        orderHistory = [];
      }

      orderHistory.push({
        userId: req.user.userId ?? null,
        action: OrderActionTypeHistory.MergeTable,
        actionAt: new Date(),
        fromDoc: orderIds[i]?.toString(),
        toDoc: groupOrderObj._id?.toString()
      });
      await this.orderModel.findByIdAndUpdate(
        orderIds[i],
        {
          orderActionHistory: orderHistory
        },
        {
          new: true,
        },
      );
    }

    await this.transactionModel.updateMany(
      { _id: { $in: transactionIds } },
      {
        $set: {
          orderId: groupOrderObj._id,
        },
      },
    );

    return groupOrderObj;
  }

  async moveItems(req: any, dto: MoveOrderItemDto): Promise<OrderDocument> {
    const sourceOrder = await this.orderModel.findById(dto.sourceOrderId);
    if (!sourceOrder)
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);

    if (sourceOrder.status == OrderStatus.Closed)
      throw new NotFoundException(VALIDATION_MESSAGES.OrderClosed.key);

    const items = [];
    // loop over the received items
    dto.items.forEach((i) => {
      const itemIndex = sourceOrder.items.findIndex((itemObj) => {
        return itemObj._id.toString() == i.itemId;
      });
      if (itemIndex > -1) {
        const itemObj = sourceOrder.items[itemIndex];
        let quantity = itemObj.quantity;
        if (i.quantity > 0) {
          if (i.quantity > quantity)
            throw new NotFoundException(
              `Not enough quantity for ${itemObj.menuItem.name}`,
            );
          quantity = i.quantity;
          sourceOrder.items[itemIndex].quantity -= quantity;
          if (sourceOrder.items[itemIndex].quantity == 0)
            sourceOrder.items.splice(itemIndex, 1);
        } else {
          sourceOrder.items.splice(itemIndex, 1);
        }
        const item = { ...itemObj.toObject(), quantity };
        delete item._id;
        items.push(item);
      } else {
        throw new NotFoundException(`${i.itemId} Not found in source order`);
      }
    });

    if (sourceOrder.items.length == 0)
      throw new NotFoundException(`Not enough items to move`);

    const supplier = await this.supplierModel
      .findById(sourceOrder.supplierId)
      .lean();

    let targetOrder = null;
    if (!dto.targetOrderId) {
      const targetOrderDto = sourceOrder.toObject();
      targetOrderDto.items = items;
      delete targetOrderDto._id;
      delete targetOrderDto.createdAt;
      delete targetOrderDto.updatedAt;
      delete targetOrderDto.orderNumber;
      targetOrderDto.transactions = [];

      targetOrderDto.tableFee = { fee: 0, tax: 0, netBeforeTax: 0 };

      if (targetOrderDto.items && targetOrderDto.items.length > 0)
        targetOrderDto.items = await this.orderHelperService.prepareOrderItems(
          targetOrderDto,
        );
      else {
        targetOrderDto.items = [];
      }

      // prepare the bundle items
      if (targetOrderDto.bundles && targetOrderDto.bundles.length > 0)
        targetOrderDto.bundles =
          await this.orderHelperService.prepareBundleItems(targetOrderDto);
      else {
        targetOrderDto.bundles = [];
      }

      targetOrderDto.summary = await this.calculationService.calculateSummery(
        targetOrderDto,
      );
      targetOrderDto.orderNumber =
        await this.orderHelperService.generateOrderNumber(supplier._id, sourceOrder.restaurantId?.toString());
      targetOrder = await this.orderModel.create(targetOrderDto);
      this.orderHelperService.postOrderCreate(req, targetOrder);
    } else {
      targetOrder = await this.orderModel.findById(dto.targetOrderId);
      targetOrder.items = targetOrder.items.concat(items);
      // prepare order items

      if (targetOrder.items && targetOrder.items.length > 0)
        targetOrder.items = await this.orderHelperService.prepareOrderItems(
          targetOrder.toObject(),
        );
      else {
        targetOrder.items = [];
      }

      // prepare the bundle items
      if (targetOrder.bundles && targetOrder.bundles.length > 0)
        targetOrder.bundles = await this.orderHelperService.prepareBundleItems(
          targetOrder.toObject(),
        );
      else {
        targetOrder.bundles = [];
      }

      // prepare summary
      targetOrder.summary = await this.calculationService.calculateSummery(
        targetOrder,
      );
      await targetOrder.save();
    }
    if (targetOrder) {
      if (sourceOrder.items && sourceOrder.items.length > 0)
        sourceOrder.items = await this.orderHelperService.prepareOrderItems(
          sourceOrder.toObject(),
        );
      else {
        sourceOrder.items = [];
      }

      // prepare the bundle items
      if (sourceOrder.bundles && sourceOrder.bundles.length > 0)
        sourceOrder.bundles = await this.orderHelperService.prepareBundleItems(
          sourceOrder.toObject(),
        );
      else {
        sourceOrder.bundles = [];
      }
      sourceOrder.summary = await this.calculationService.calculateSummery(
        sourceOrder,
      );

      await sourceOrder.save();
    }
    return targetOrder;
  }

  async kitchenQueueProcess(req: any, dto: KitchenQueueProcessDto) {
    const order = await this.orderModel.findById(dto.orderId);

    if (!order) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }

    let actualDateObj: any = {};
    if (dto.preparationStatus == PreparationStatus.StartedPreparing) {
      actualDateObj = {
        status: PreparationStatus.StartedPreparing,
      };
      // if (!order.preparationDetails?.actualStartTime) {
      //   actualDateObj['preparationDetails.actualStartTime'] = new Date();
      // }
    }
    const dataToSet = {
      $set: {
        'items.$[element].preparationStatus': dto.preparationStatus,
        ...actualDateObj,
      },
    };
    let arrayFilter: any = {
      arrayFilters: [{ 'element._id': { $ne: null } }],
    };
    if (dto.orderItemId) {
      arrayFilter = {
        arrayFilters: [
          { 'element._id': new mongoose.Types.ObjectId(dto.orderItemId) },
        ],
      };
    } else {
      const user = await this.userModel.findById(req.user.userId);
      if (user && user.kitchenQueue) {
        arrayFilter = {
          arrayFilters: [
            {
              'element.kitchenQueueId': new mongoose.Types.ObjectId(
                user.kitchenQueue.toString(),
              ),
            },
          ],
        };
      }
    }
    await this.orderModel.updateMany({ _id: dto.orderId }, dataToSet, {
      ...arrayFilter,
    });
    await this.orderHelperService.postKitchenQueueProcessing(order, dto);
    return true;
  }

  async massReset(req, dto: MassActionDto) {
    for (const i in dto.orderIds) {
      try {
        this.update(req, dto.orderIds[i], { status: OrderStatus.Reset });
      } catch (err) {
        console.log(
          `Mass Reset is failed for order Id - ${dto.orderIds[i]} - Error `,
          err,
        );
      }
    }
    return true;
  }

  async massCancel(req, dto: MassCancelDto) {
    let cumulativeSum = 0,
      skip = 0,
      amount = dto.amount;

    if (dto.amountType == CalculationType.Percentage) {
      const result = await this.orderModel.aggregate([
        {
          $match: {
            _id: {
              $in: dto.orderIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$summary.totalWithTax' },
          },
        },
      ]);
      if (result && result.length == 1) {
        const total = result[0].total;
        amount = (dto.amount * total) / 100;
      }
    }
    if (!dto.amount) {
      amount = cumulativeSum + 1;
    }
    while (cumulativeSum < amount) {
      const orders = await this.fetchOrdersForBatch(dto, skip);
      if (orders.length == 0) break;
      skip += 20;
      for (const i in orders) {
        if (!dto.amount) amount = cumulativeSum + 1;
        if (cumulativeSum >= dto.amount) break;

        try {
          this.update(req, orders[i]._id, {
            status: OrderStatus.Cancelled,
          });

          cumulativeSum += orders[i].summary.totalWithTax;
        } catch (err) {
          console.log(`Order mass cancel failed for for ${orders[i]._id}`, err);
        }
      }
    }
    return true;
  }

  async fetchOrdersForBatch(dto: any, skip = 0, limit = 20) {
    const orders = this.orderModel.find(
      { _id: { $in: dto.orderIds } },
      {},
      {
        skip,
        limit,
        sort: { _id: -1 },
      },
    );
    return orders;
  }

  async generalUpdate(
    req: any,
    orderId: string,
    dto: any,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findByIdAndUpdate(orderId, dto, {
      new: true,
    });

    if (!order) {
      throw new NotFoundException();
    }
    return order;
  }

  async identifyPrinters(
    req,
    query: QueryIdentifyPrinterDto,
    order: OrderDocument = null,
    returnPrinterItems = false,
  ) {
    if (!order) {
      order = await this.orderModel.findById(query.orderId);
    }

    if (!order) {
      throw new NotFoundException();
    }

    let printers = [],
      printerItems = [],
      itemsWithoutPrinter = [];
    // if (!query.printerType || query.printerType == PrinterType.Cashier) {
    //   if (order.cashierId) {
    //     const cashier = await this.cashierModel.findById(order.cashierId);
    //     if (cashier && cashier.printerId) {
    //       printers.push(cashier.printerId.toString());
    //     }
    //   }
    //}
    if (!query.printerType || query.printerType == PrinterType.Kitchen) {
      let menuItemIds = order.items?.map((oi) => oi.menuItem.menuItemId);
      const bundleMenuItemsIds = order.bundles
        ?.map((b) => b.bundleSubGroups)
        .flat()
        .map((sg) => sg.items)
        .flat()
        .map((i) => i.menuItemId);
      menuItemIds = menuItemIds.concat(bundleMenuItemsIds);
      const menuItems = await this.menuItemModel
        .find({
          _id: { $in: menuItemIds },
        })
        .populate([
          {
            path: 'categoryId',
            select: { printerId: 1 },
          },
        ]);
      for (const i in menuItems) {
        if (menuItems[i].categoryId?.printerId) {
          printers.push(menuItems[i].categoryId?.printerId.toString());
          if (!printerItems[menuItems[i].categoryId?.printerId.toString()]) {
            printerItems[menuItems[i].categoryId?.printerId.toString()] = [];
          }
          printerItems[menuItems[i].categoryId?.printerId.toString()].push(
            menuItems[i]._id.toString(),
          );
        } else {
          itemsWithoutPrinter.push(menuItems[i]._id.toString());
        }
      }
    }
    if (itemsWithoutPrinter.length > 0) {
      const defaultKitchenPrinter = await this.printerModel.findOne({
        isDefault: true,
        supplierId: req.user.supplierId,
        type: PrinterType.Kitchen,
      });
      if (defaultKitchenPrinter) {
        printers.push(defaultKitchenPrinter._id.toString());
        printerItems[defaultKitchenPrinter._id.toString()] =
          itemsWithoutPrinter;
      }
    }
    printers = [...new Set(printers)];
    if (returnPrinterItems) {
      return { printers, printerItems };
    }
    return printers;
  }
  async deleteAll(req) {
    await this.transactionModel.deleteMany({ supplierId: req.user.supplierId });
    await this.invoiceModel.deleteMany({ supplierId: req.user.supplierId });
    await this.orderModel.deleteMany({ supplierId: req.user.supplierId });
    await this.deferredTransactionModel.deleteMany({
      supplierId: req.user.supplierId,
    });

    await this.cashierLogModel.deleteMany({
      supplierId: req.user.supplierId,
    });

    await this.tableLogModel.deleteMany({
      supplierId: req.user.supplierId,
    });
    await this.tableModel.updateMany(
      { supplierId: req.user.supplierId },
      { currentTableLog: null },
    );
    await this.cashierModel.updateMany(
      { supplierId: req.user.supplierId },
      { currentLog: null },
    );
    this.cacheDataService.invalidateCache(req, {
      supplierId: req.user.supplierId,
    });
  }
  async deleteOrder(req, orderId) {
    await this.transactionModel.deleteMany({
      supplierId: req.user.supplierId,
      orderId,
    });
    await this.invoiceModel.deleteMany({
      supplierId: req.user.supplierId,
      orderId,
    });
    await this.orderModel.deleteMany({
      supplierId: req.user.supplierId,
      _id: orderId,
    });
    await this.deferredTransactionModel.deleteMany({
      supplierId: req.user.supplierId,
      orderId,
    });
  }
  async driverReport(req, query: DriverReportDto, isFile = false) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    let queryToApply: any = {};
    let createdAtQuery: any = {};
    if (query.startDate && query.endDate) {
      query.startDate.setUTCHours(query.startDate.getHours());
      query.startDate.setUTCMinutes(query.startDate.getMinutes());
      query.startDate = new Date(
        query.startDate.toLocaleString('en', { timeZone: timezone }),
      );
      query.endDate.setUTCHours(query.endDate.getHours());
      query.endDate.setUTCMinutes(query.endDate.getMinutes());
      query.endDate = new Date(
        query.endDate.toLocaleString('en', { timeZone: timezone }),
      );
      createdAtQuery = {
        createdAt: {
          $gte: query.startDate,
          $lte: query.endDate,
        },
      };
    }
    if (query.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(
        query.restaurantId,
      );
    }

    const book = new Workbook();
    const sheet = book.addWorksheet('Drivers');
    const response = [],
      records = [
        ['Names', 'Number of Orders', 'Order Value'],
        // [
        //   'اسم الموظف',
        //   'مبيعات كاش',
        //   'مبيعات شبكة',
        //   'مصروفات',
        //   'صافي الكاش',
        //   'الشفت',
        // ],
      ];
    const orders = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          driverId: { $ne: null },
          deliveryStatus: DeliveryStatus.Delivered,
          status: {
            $nin: [
              OrderStatus.Cancelled,
              OrderStatus.Closed,
              OrderStatus.CancelledByMerge,
              OrderStatus.CancelledWihPaymentFailed,
            ],
          },
          ...queryToApply,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'driverId',
          foreignField: '_id',
          as: 'driverId',
        },
      },
      {
        $unwind: '$driverId',
      },
      {
        $group: {
          _id: { driverId: '$driverId._id', deliveryStatus: '$deliveryStatus' },
          //totalExpenses: { $sum: '$expenses.amount' },
          name: { $first: '$driverId.name' },
          totalOrders: { $sum: 1 },
          totalAmount: {
            $sum: '$summary.totalWithTax',
          },
        },
      },
    ]);

    for (const i in orders) {
      const row = {
        name: orders[i].name,
        deliveryStatus: orders[i]._id.deliveryStatus,
        totalOrders: orders[i].totalOrders,
        totalAmount: orders[i].totalAmount,
      };
      if (isFile) {
        records.push(Object.values(row));
      } else {
        response.push(row);
      }
    }

    if (!isFile) return response;
    sheet.addRows(records);
    const tmpFile = tmp.fileSync({
      mode: 0o644,
    });
    await book.xlsx.writeFile(tmpFile.name);
    const file = fs.createReadStream(tmpFile.name);
    return new StreamableFile(file);
  }

  async updateOrderAfterShisha(req, orderId: string,
    dto: any,
    allowForceUpdate = false): Promise<any> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException();
    }
    //creating new order object with existing data  + updated dto
    const orderData: any = { ...order.toObject(), ...dto };

    let supplier = await this.cacheService.get(req.user.supplierId.toString());
    if (!supplier) {
      supplier = await this.supplierModel.findById(req.user.supplierId).lean();
      await this.cacheService.set(supplier._id.toString(), supplier);
    }

    if (dto.items || dto.couponCode) {
      if (!dto.couponCode) orderData.couponCode = order.couponCode;

      orderData._id = order._id;

      if (orderData.items && orderData.items.length > 0) {
        orderData.feeRate = supplier.feeRate ?? 0;
        orderData.isShishaFeeApplicable = false;
        orderData.items = await this.orderHelperService.prepareOrderItems(
          orderData,
        );
      } else {
        orderData.items = [];
      }

      // prepare the bundle items
      if (orderData.bundles && orderData.bundles.length > 0)
        orderData.bundles = await this.orderHelperService.prepareBundleItems(
          orderData, false, true
        );
      else {
        orderData.bundles = [];
      }

      //Calculate summary
      orderData.summary = await this.calculationService.calculateSummery(
        orderData,
      );
    }
    // handle payment status
    if (orderData.summary.totalPaid > 0) {
      if (
        orderData.summary.totalPaid >
        orderData.summary.totalWithTax + (orderData.tip ?? 0)
      ) {
        orderData.paymentStatus = OrderPaymentStatus.OverPaid;
      } else if (
        orderData.summary.totalPaid ==
        orderData.summary.totalWithTax + (orderData.tip ?? 0)
      ) {
        orderData.paymentStatus = OrderPaymentStatus.Paid;
      } else {
        orderData.paymentStatus = OrderPaymentStatus.NotPaid;
      }
    }

    //updating the final data

    const modified = await this.orderModel.findByIdAndUpdate(
      orderId,
      orderData,
      {
        new: true,
      },
    );

    return modified;

  }


  async updateShishaManually(dto: QueryManualShishaUpdateDto) {
    const batch = await this.batchModel.create({
      supplierId: dto.supplierId,
      request: dto,
      action: BatchAction.ManualShishaUpdate,
    });
    this.processShishaManually(dto.supplierId, dto.startDate, dto.endDate, batch);
    return batch;
  }

  async processShishaManually(supplierId: string, _startDate: any,
    _endDate: any, batch: BatchDocument) {
    console.log("lets start here");
    const startDate = new Date(_startDate);
    const endDate = new Date(_endDate);

    if (startDate && endDate) {
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);
    }
    console.log("startDate", startDate);
    console.log("startDate", endDate);
    const req = {
      user: {
        supplierId: supplierId
      }
    }

    const order = await this.orderModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      supplierId: new mongoose.Types.ObjectId(supplierId),
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
      $or: [
        { "summary.totalShishaSales": { $exists: false } },
        { "summary.totalShishaSales": { $eq: 0 } }
      ]
    });

    console.log("order", order.length);

    let processedOrders = 0, totalOrders = order.length;

    for (const o of order) {
      let newItems = [];
      for (let item of o.items) {
        let lineItem = item;
        newItems.push({
          menuItem: lineItem.menuItem,
          additions: lineItem.additions,
          quantity: lineItem.quantity,
          notes: lineItem.notes,
          _id: lineItem._id
        });
      }
      let newBundles = [];
      if (o.bundles && o.bundles?.length > 0) {
        for (let el of o.bundles) {
          newBundles.push({
            bundleId: el.bundleId,
            quantity: el.quantity,
            bundleSubGroups: el.bundleSubGroups,
            notes: el.notes
          });
        }
      }

      await this.updateOrderAfterShisha(req, o._id, {
        items: newItems,
        bundles: newBundles
      }, true);

      processedOrders++;
      if (processedOrders % 10 == 0) {
        batch.set({
          response: {
            processedOrders,
            totalOrders
          },
        });
        await batch.save();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    batch.set({
      response: {
        processedOrders,
        totalOrders
      },
    });
    batch.status = 'completed';
    await batch.save();
    return batch;
  }

  async cashOrderDataOnly(req: any, query: any) {

    let queryToApply: any = {};
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }
    if (!query.restaurantId || query.restaurantId == '') {
      const getAllRest = await this.userModel.findById(req.user.userId);
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.restaurantId = {
          $in: getAllRest?.restaurantId
        };
      }
    }
    if (query.cashierLogIds && query.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = { $in: query.cashierLogIds };
    }
    if (query.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (query.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (query.menuItemIds && query.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = { $in: query.menuItemIds };
    }

    if (query.search) {
      queryToApply.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { contactNumber: { $regex: query.search, $options: 'i' } },
        { orderNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }
    if (query.startDate && query.endDate) {
      query.startDate = new Date(query.startDate);
      query.endDate = new Date(query.endDate);
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

      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (query.paymentMethod) {
      const transactions = await this.transactionModel.find({
        supplierId: req.user.supplierId,
        paymentMethod: query.paymentMethod,
        createdAt: {
          $gte: query.startDate,
          $lte: query.endDate,
        }
      });
      const transactionIds = transactions.map(transaction => transaction._id);
      queryToApply.transactions = { $in: transactionIds }
      delete queryToApply.paymentMethod;
    }

    const result = await this.orderModel.aggregate([
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
      {
        $group: {
          _id: null,
          total: { $sum: '$summary.totalWithTax' },
        },
      },
    ]);
    return result;
  }

  async removeCashAmountOrder(req, query: any, dto: RemoveCashOrder) {

    const batch = await this.batchModel.create({
      supplierId: req.user.supplierId,
      request: dto,
      action: BatchAction.RemoveCashOrder,
    });
    this.removeCashOrders(req, query, dto, batch);
    return batch;
  }

  async removeCashOrders(req, query: any, dto: RemoveCashOrder, batch: BatchDocument) {
    let queryToApply: any = {};

    if (!query.restaurantId || query.restaurantId == '') {
      const getAllRest = await this.userModel.findById(req.user.userId);
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.restaurantId = {
          $in: getAllRest?.restaurantId
        };
      }
    }
    if (query.cashierLogIds && query.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = { $in: query.cashierLogIds };
    }
    if (query.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (query.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (query.menuItemIds && query.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = { $in: query.menuItemIds };
    }

    if (query.search) {
      queryToApply.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { contactNumber: { $regex: query.search, $options: 'i' } },
        { orderNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }
    if (query.startDate && query.endDate) {
      query.startDate = new Date(query.startDate);
      query.endDate = new Date(query.endDate);
      query.startDate.setUTCHours(0);
      query.startDate.setUTCMinutes(0);
      query.endDate.setUTCHours(23);
      query.endDate.setUTCMinutes(59);

      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    // if (query.paymentMethod) {
    const transactions = await this.transactionModel.find({
      supplierId: req.user.supplierId,
      paymentMethod: 'Cash',
      createdAt: {
        $gte: query.startDate,
        $lte: query.endDate,
      }
    });
    const transactionIds = transactions.map(transaction => transaction._id);
    queryToApply.transactions = { $in: transactionIds }
    delete queryToApply.paymentMethod;
    // }

    console.log("queryToApply", queryToApply);

    const order = await this.orderModel
      .find(
        {
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
        }
      )
      .sort({ "summary.totalWithTax": 1 });


    let processedOrders = 0;
    let totalOrders = order.length;
    let deletedItems = 0;
    let deletedOrders = 0;
    let reducedAmount = 0;

    for (const o of order) {
      reducedAmount += o.summary.totalWithTax;
      // console.log("o.summary",o.summary);
      await this.orderModel.findByIdAndDelete(o._id);
      deletedOrders++;

      processedOrders++;
      if (processedOrders % 5 == 0) {
        batch.set({
          response: {
            processedOrders,
            totalOrders,
            deletedItems,
            deletedOrders,
            reducedCash: roundOffNumber(reducedAmount),
          },
        });
        await batch.save();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (reducedAmount > dto.removeCashAmount) {
        break;
      }
    }
    batch.set({
      response: {
        processedOrders,
        totalOrders,
        deletedItems,
        deletedOrders,
        reducedShishaTax: roundOffNumber(reducedAmount),
      },
    });
    batch.status = 'completed';
    await batch.save();
    return batch;
  }

}
