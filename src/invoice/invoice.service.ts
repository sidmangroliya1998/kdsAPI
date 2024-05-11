import { Invoice } from '@axenda/zatca';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import Handlebars from 'handlebars';

import * as MomentHandler from 'handlebars.moment';
import { FatooraService } from './fatoora.service';
import { S3Service } from 'src/core/Providers/Storage/S3.service';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { InvoiceDocument } from './schemas/invoice.schema';
import { InvoiceType } from './invoice.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import { InvoiceStatus, OrderPaymentStatus, OrderStatus } from 'src/order/enum/en.enum';
import { InvoiceHelperService } from './invoice-helper.service';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

import { EscCommandsDto } from './dto/esc-commands.dto';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { PrintInvoiceDto } from './dto/print-invoice.dto';
import { Printer, PrinterDocument } from 'src/printer/schema/printer.schema';
import { Cashier } from 'src/cashier/schemas/cashier.schema';
import { PrinterType } from 'src/printer/enum/en';
import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { QueryOrderDto } from 'src/order/dto/query-order.dto';
import {
  CreateMassInvoiceDto,
  ReduceShishaTaxAndMassInvoiceDto,
} from './dto/create-mass-invoice.dto';
import {
  CashierLog,
  CashierLogDocument,
} from 'src/cashier/schemas/cashier-log.schema';
import { CalculationType } from 'src/core/Constants/enum';
import { OrderService } from 'src/order/order.service';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Batch, BatchDocument } from 'src/batch/schemas/batch.schema';
import { BatchAction } from 'src/batch/enum/en';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { restaurantId } from '../../test1/constants/test.constant';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { CalculationService } from 'src/order/calculation.service';
import { OrderHelperService } from 'src/order/order-helper.service';

MomentHandler.registerHelpers(Handlebars);
Handlebars.registerHelper('math', function (lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
    '+': lvalue + rvalue,
    '-': lvalue - rvalue,
    '*': lvalue * rvalue,
    '/': lvalue / rvalue,
    '%': lvalue % rvalue,
  }[operator];
});

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceHelperService: InvoiceHelperService,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Invoice.name)
    private invoiceModelPag: PaginateModel<InvoiceDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Printer.name) private printerModel: Model<PrinterDocument>,
    private readonly socketGateway: SocketIoGateway,
    @InjectModel(CashierLog.name)
    private readonly cashierLogModel: Model<CashierLogDocument>,
    @InjectModel(Batch.name)
    private readonly batchModel: Model<BatchDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => CalculationService))
    private readonly calculationService: CalculationService,
    @Inject(forwardRef(() => OrderHelperService))
    private readonly orderHelperService: OrderHelperService,
  ) { }

  async checkIfInvoiceExist(orderId: string): Promise<number> {
    const invoice = await this.invoiceModel.count({
      orderId,
      type: InvoiceType.Invoice,
      isReversedInvoice: false,
      reversedInvoiceId: null,
    });
    return invoice;
  }

  async create(
    req,
    dto: CreateInvoiceDto,
    cancelledInvoice: InvoiceDocument = null,
  ): Promise<InvoiceDocument> {
    const order = await this.orderModel.findById(dto.orderId).populate([
      {
        path: 'supplierId',
      },
      {
        path: 'restaurantId',
      },
      {
        path: 'tableId',
      },
      {
        path: 'customerId',
      },
    ]);
    // check if invoice already exist
    if (
      !cancelledInvoice &&
      dto.type == InvoiceType.Invoice &&
      (await this.checkIfInvoiceExist(dto.orderId)) > 0
    ) {
      throw new BadRequestException(VALIDATION_MESSAGES.InvoiceExists.key);
    }
    dto.invoiceNumber = cancelledInvoice
      ? cancelledInvoice.invoiceNumber
      : await this.invoiceHelperService.generateInvoiceNumber(
        order.supplierId._id,
        dto.type,
      );
    let invoiceData = { url: '', items: null, html: '', imageUrl: '' },
      refInvoice = null;
    // generate invoice
    if (dto.type == InvoiceType.Invoice || dto.type == InvoiceType.Receipt)
      invoiceData = await this.invoiceHelperService.generateInvoice(
        order.toObject(),
        dto,
        cancelledInvoice,
      );
    else if (dto.type == InvoiceType.CreditMemo) {
      refInvoice = await this.invoiceModel.findOne({
        orderId: order._id,
        type: InvoiceType.Invoice,
      });
      if (!refInvoice) {
        throw new BadRequestException(
          VALIDATION_MESSAGES.RefInvoiceNotFound.key,
        );
      }
      invoiceData = await this.invoiceHelperService.generateCreditMemo(
        order.toObject(),
        dto,
        refInvoice,
        cancelledInvoice,
      );
    }
    // console.log(invoiceData);
    // create invoice record
    const invoice = await this.invoiceModel.create({
      ...dto,
      orderNumber: order.orderNumber,
      addedBy: req?.user?.userId ?? null,
      supplierId: order.supplierId._id,
      restaurantId: order.restaurantId._id,
      url: invoiceData.url,
      imageUrl: invoiceData.imageUrl,
      items: invoiceData.items,
      refInvoiceId: refInvoice ? refInvoice._id : null,
      isReversedInvoice: cancelledInvoice ? true : false,
      refOriginalInvoiceId: cancelledInvoice ? cancelledInvoice._id : null,
      totalWithTax: cancelledInvoice
        ? cancelledInvoice.totalWithTax
        : order.summary.totalWithTax,
      totalTaxable: cancelledInvoice
        ? cancelledInvoice.totalTaxable
        : order.summary.totalTaxableAmount,
      totalTax: cancelledInvoice
        ? cancelledInvoice.totalTax
        : order.summary.totalTax,
    });

    this.invoiceHelperService.postInvoiceCreate(invoice, order);

    return invoice;
  }

  async cancel(req, invoiceId: string, type = 'invoice') {
    let invoice = null;
    if (type == 'order') {
      invoice = await this.invoiceModel.findOne({
        orderId: invoiceId,
        type: InvoiceType.Invoice,
        isReversedInvoice: false,
        reversedInvoiceId: null,
      });
    } else {
      invoice = await this.invoiceModel.findOne({
        _id: invoiceId,
        reversedInvoiceId: null,
      });
    }

    // check if already cancelled
    if (!invoice) {
      throw new BadRequestException(VALIDATION_MESSAGES.AlreadyCancelled.key);
    }
    const invoiceData = invoice.toObject();
    // check if its main invoice and any credit / debit memo is already created
    if (invoice.type == InvoiceType.Invoice) {
      const relatedInvoice = await this.invoiceModel.count({
        refInvoiceId: invoice._id,
      });
      if (relatedInvoice > 0) {
        throw new BadRequestException(VALIDATION_MESSAGES.CancelCreditMemo.key);
      }
    }
    // generate reversed invoice
    const reversedInvoice = await this.create(
      req,
      {
        orderId: invoice.orderId.toString(),
        type: invoice.type,
        items: invoiceData.items,
      },
      invoice,
    );

    invoice.reversedInvoiceId = reversedInvoice._id;
    invoice.save();
    return reversedInvoice;
  }

  async all(
    req: any,
    queryInvoice: QueryInvoiceDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InvoiceDocument>> {
    const criteria: any = {
      ...queryInvoice,
    };

    const invoices = await this.invoiceModelPag.paginate(criteria, {
      sort: DefaultSort,
      lean: true,
      ...paginateOptions,
      ...pagination,
    });
    return invoices;
  }

  async createReduceShishaTaxBatch(req, dto: ReduceShishaTaxAndMassInvoiceDto) {
    const batch = await this.batchModel.create({
      supplierId: req.user.supplierId,
      request: dto,
      action: BatchAction.ReduceShishaTax,
    });

    this.removeShishaTax(req, dto, batch);

    return batch;
  }
  async createOrderCorrectionBatch(req, dto: CreateMassInvoiceDto) {
    const batch = await this.batchModel.create({
      supplierId: req.user.supplierId,
      request: {},
      action: BatchAction.CorrectShishaOrders,
    });

    this.correctShishaOrders(req, dto, batch);

    return batch;
  }

  async createMassInvoiceBatch(req, dto: CreateMassInvoiceDto) {
    const batch = await this.batchModel.create({
      supplierId: req.user.supplierId,
      request: { ...dto },
      action: BatchAction.CreateInvoice,
    });

    this.massCreateInvoice(req, dto, batch);

    return batch;
  }
  async correctShishaOrders(
    req,
    dto: CreateMassInvoiceDto,
    batch: BatchDocument,
  ) {
    let processed = 0;
    let queryToApply: any = {
      ...dto,

      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
    };

    if (dto.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${dto.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (dto.cashierLogIds && dto.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = {
        $in: dto.cashierLogIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (dto.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (dto.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = {
        $in: dto.menuItemIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (dto.customerId) {
      queryToApply.customerId = new mongoose.Types.ObjectId(dto.customerId);
    }
    if (dto.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(dto.restaurantId);
    }
    if (dto.driverId) {
      queryToApply.driverId = new mongoose.Types.ObjectId(dto.driverId);
    }
    if (dto.tableId) {
      queryToApply.tableId = new mongoose.Types.ObjectId(dto.tableId);
    }
    if (dto.waiterId) {
      queryToApply.waiterId = new mongoose.Types.ObjectId(dto.waiterId);
    }

    if (dto.search) {
      queryToApply.$or = [
        { name: { $regex: dto.search, $options: 'i' } },
        { contactNumber: { $regex: dto.search, $options: 'i' } },
        { orderNumber: { $regex: dto.search, $options: 'i' } },
      ];
    }

    if (dto.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(59);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    const orders = await this.orderModel.find({
      ...queryToApply,
    });
    console.log(orders.length);
    batch.set({
      response: {
        totalOrders: orders.length,
        processedOrders: 0,
      },
    });
    for (const i in orders) {
      try {
        await this.orderService.update(
          req,
          orders[i]._id.toString(),
          {
            items: orders[i].items.map((item) => item.toObject()),
          },
          true,
        );
        processed++;
        if (processed % 5 == 0) {
          batch.response = {
            totalOrders: orders.length,
            processedOrders: processed,
          };
          await batch.save();
        }
      } catch (err) {
        console.error(
          `Error While processing Correct Shisha Order batch for Order - ${orders[i]._id}`,
          err,
        );
      }
    }
    batch.response = {
      totalOrders: orders.length,
      processedOrders: processed,
    };
    batch.status = 'completed';
    await batch.save();
  }

  async massCreateInvoiceNew(req, dto: QueryOrderDto) {

    const batch = await this.batchModel.create({
      supplierId: req.user.supplierId,
      request: dto,
      action: BatchAction.CreateInvoice,
    });
    this.createMassInvoiceProcess(req, dto, batch);

    return batch;
  }

  async createMassInvoiceProcess(req,
    dto: QueryOrderDto, batch: BatchDocument) {

    let queryToApply: any = {};

    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );

    }
    if (dto.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${dto.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (dto.cashierLogIds && dto.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = {
        $in: dto.cashierLogIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (dto.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (dto.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = {
        $in: dto.menuItemIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (dto.customerId) {
      queryToApply.customerId = new mongoose.Types.ObjectId(dto.customerId);
    }
    if (dto.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(dto.restaurantId);
    }
    if (dto.driverId) {
      queryToApply.driverId = new mongoose.Types.ObjectId(dto.driverId);
    }
    if (dto.tableId) {
      queryToApply.tableId = new mongoose.Types.ObjectId(dto.tableId);
    }
    if (dto.waiterId) {
      queryToApply.waiterId = new mongoose.Types.ObjectId(dto.waiterId);
    }

    if (dto.search) {
      queryToApply.$or = [
        { name: { $regex: dto.search, $options: 'i' } },
        { contactNumber: { $regex: dto.search, $options: 'i' } },
        { orderNumber: { $regex: dto.search, $options: 'i' } },
      ];
    }

    if (dto.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }

    if (dto.orderIds && dto.orderIds.length > 0) {
      queryToApply = {
        _id: {
          $in: dto.orderIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      };
    }

    const order = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: dto.startDate, $lt: dto.endDate },
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
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
          ...queryToApply
        }
      }
    ]);


    let totalOrders = order.length,
      failed = 0;
    let invoiceCount = 0;

    for (const orders of order) {
      try {
        await this.create(req, {
          orderId: orders._id,
          type: InvoiceType.Invoice,
        });
        invoiceCount++;
        if (invoiceCount % 5 == 0) {
          batch.set({
            response: {
              invoiceCount,
              totalOrders,
              failed
            },
          });
          await batch.save();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (err) {
        failed++;
      }
    }
    batch.set({
      response: {
        invoiceCount,
        totalOrders,
        failed,
      },
    });
    batch.status = 'completed';
    await batch.save();

    return batch;
  }

  async removeShishaTaxNew(req,
    dto: ReduceShishaTaxAndMassInvoiceDto) {
    const batch = await this.batchModel.create({
      supplierId: req.user.supplierId,
      request: dto,
      action: BatchAction.ReduceShishaTax,
    });
    this.removeShishaTaxProcess(req, dto, batch);
    return batch;
  }

  async removeShishaTaxProcess(req,
    dto: ReduceShishaTaxAndMassInvoiceDto,
    batch: BatchDocument
  ) {
    let queryToApply: any = {};
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(59);
    }
    if (dto.filter) {
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${dto.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (dto.cashierLogIds && dto.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = {
        $in: dto.cashierLogIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (dto.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (dto.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = {
        $in: dto.menuItemIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (dto.customerId) {
      queryToApply.customerId = new mongoose.Types.ObjectId(dto.customerId);
    }
    if (dto.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(dto.restaurantId);
    }
    if (dto.driverId) {
      queryToApply.driverId = new mongoose.Types.ObjectId(dto.driverId);
    }
    if (dto.tableId) {
      queryToApply.tableId = new mongoose.Types.ObjectId(dto.tableId);
    }
    if (dto.waiterId) {
      queryToApply.waiterId = new mongoose.Types.ObjectId(dto.waiterId);
    }

    if (dto.search) {
      queryToApply.$or = [
        { name: { $regex: dto.search, $options: 'i' } },
        { contactNumber: { $regex: dto.search, $options: 'i' } },
        { orderNumber: { $regex: dto.search, $options: 'i' } },
      ];
    }

    if (dto.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }

    const order = await this.orderModel.find({
      createdAt: { $gte: dto.startDate, $lte: dto.endDate },
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
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
      "summary.totalFee": { $gt: 0 },
      "summary.totalShishaSales": { $gt: 0 },
      ...queryToApply
    });

    let processedOrders = 0;
    let totalOrders = order.length;
    let deletedItems = 0;
    let deletedOrders = 0;
    let reducedAmount = 0;

    for (const o of order) {
      let itemsToRemove = [];
      let newOrderItems = await this.orderModel.findById(o._id);

      let newItems = [];
      for (let item of o.items) {
        let lineItem = item;
        if (lineItem.totalFee > 0 && reducedAmount < dto.shishaTaxToReduce) {
          reducedAmount += lineItem.totalFee;
          deletedItems++;
          itemsToRemove.push(lineItem._id);
          newOrderItems.items = newOrderItems.items.filter(item => item._id.toString()
            !== lineItem._id.toString());
        }
        if (reducedAmount > dto.shishaTaxToReduce) {
          break;
        }
      }
      //Bundle Calculation

      let newBundles = [];
      if (o.bundles && o.bundles?.length > 0) {
        for (let b of o.bundles) {
          for (let bg of b.bundleSubGroups) {
            let removedBGItems = [];
            for (let item of bg.items) {
              let lineItem = item;
              if (lineItem.totalFee > 0 && reducedAmount < dto.shishaTaxToReduce) {
                reducedAmount += lineItem.totalFee;
                deletedItems++;
                itemsToRemove.push(lineItem.menuItemId);
                removedBGItems.push(lineItem.menuItemId);
              }
              if (reducedAmount > dto.shishaTaxToReduce) {
                break;
              }
            }
            bg.items = bg.items.filter((f: any) => !removedBGItems.includes(f.menuItemId));
            b.bundleSubGroups = b.bundleSubGroups.filter((f: any) => f.items.length > 0);
          }
        }
        newOrderItems.bundles = o.bundles;
      }

      if (newOrderItems.items.length === 0 && newOrderItems.bundles.length === 0) {
        await this.orderModel.findByIdAndDelete(o._id);
        deletedOrders++;
      } else {

        for (let i = 0; i < newOrderItems.items.length; i++) {
          const el = newOrderItems.items[i];
          newItems.push({
            menuItem: el.menuItem,
            additions: el.additions,
            quantity: el.quantity,
            notes: el.notes,
            _id: el._id
          });
        }
        for (let i = 0; i < newOrderItems.bundles.length; i++) {
          const el = newOrderItems.bundles[i];
          newBundles.push({
            bundleId: el.bundleId,
            quantity: el.quantity,
            bundleSubGroups: el.bundleSubGroups,
            notes: el.notes
          });
        }

        await this.orderService.updateOrderAfterShisha(req, o._id, {
          items: newItems,
          bundles: newBundles
        }, true);
      }

      processedOrders++;
      if (processedOrders % 5 == 0) {
        batch.set({
          response: {
            processedOrders,
            totalOrders,
            deletedItems,
            deletedOrders,
            reducedShishaTax: roundOffNumber(reducedAmount),
          },
        });
        await batch.save();
        await new Promise((resolve) => setTimeout(resolve, 3000));
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


  async removeShishaTax(
    req,
    dto: ReduceShishaTaxAndMassInvoiceDto,
    batch: BatchDocument,
  ) {
    let cumulativeSum = 0,
      skip = 0,
      amount = dto.shishaTaxToReduce,
      deletedOrders = 0,
      deletedItems = 0;
    const skippedOrders = [];

    let orderIdQuery = {};
    // if (dto.orderIds && dto.orderIds.length > 0) {
    //   orderIdQuery = {
    //     _id: {
    //       $in: dto.orderIds.map((id) => new mongoose.Types.ObjectId(id)),
    //     },
    //   };
    // }
    let queryToApply: any = {
      ...dto,
      // ...orderIdQuery,
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
      'summary.totalFee': {
        $gt: 0,
      },
    };

    if (dto.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${dto.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (dto.cashierLogIds && dto.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = {
        $in: dto.cashierLogIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (dto.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (dto.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = {
        $in: dto.menuItemIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (dto.customerId) {
      queryToApply.customerId = new mongoose.Types.ObjectId(dto.customerId);
    }
    if (dto.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(dto.restaurantId);
    }
    if (dto.driverId) {
      queryToApply.driverId = new mongoose.Types.ObjectId(dto.driverId);
    }
    if (dto.tableId) {
      queryToApply.tableId = new mongoose.Types.ObjectId(dto.tableId);
    }
    if (dto.waiterId) {
      queryToApply.waiterId = new mongoose.Types.ObjectId(dto.waiterId);
    }

    if (dto.search) {
      queryToApply.$or = [
        { name: { $regex: dto.search, $options: 'i' } },
        { contactNumber: { $regex: dto.search, $options: 'i' } },
        { orderNumber: { $regex: dto.search, $options: 'i' } },
      ];
    }

    if (dto.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (dto.amountType == CalculationType.Percentage) {
      const result = await this.orderModel.aggregate([
        {
          $match: {
            ...queryToApply,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$summary.totalFee' },
          },
        },
      ]);
      if (result && result.length == 1) {
        const total = result[0].total;
        amount = (dto.shishaTaxToReduce * total) / 100;
      }
    }
    const totalOrders = await this.orderModel.count(queryToApply);
    let processedOrders = 0;
    let lastOrderId = null;
    while (cumulativeSum < amount) {
      if (lastOrderId) queryToApply._id = { $lt: lastOrderId };
      const orders = await this.fetchOrdersForBatch(dto, skip, 50, {
        ...queryToApply,
      });

      if (orders.length == 0) break;
      //skip += 50;
      for (const i in orders) {
        try {
          console.log('$$$$$$$$$$$$$', orders[i]);
          lastOrderId = orders[i]._id;
          if (cumulativeSum < amount) {
            let items: any = orders[i].items.filter(
              (oi) => oi.menuItem.feeRate == 0,
            );
            if (items.length == 0) {
              skippedOrders.push(orders[i]);
              continue;
            }
            console.log('###', {
              items: items.map((item) => {
                return { ...item.toObject() };
              }),
            });
            await this.orderService.update(
              req,
              orders[i]._id.toString(),
              {
                items: items.map((item) => item.toObject()),
              },
              true,
            );
            console.log('***', cumulativeSum);
            processedOrders++;
            deletedItems += orders[i].items.length - items.length;
            cumulativeSum += orders[i].summary.totalFee;
            if (processedOrders % 5 == 0) {
              batch.set({
                response: {
                  processedOrders,
                  totalOrders,
                  deletedItems,
                  deletedOrders,
                  reducedShishaTax: roundOffNumber(cumulativeSum),
                },
              });
              await batch.save();
            }
          } else {
            break;
          }
        } catch (err) {
          console.error(
            `Error while processing shisha reduce batch for order ${orders[i]._id}`,
            err,
          );
        }
      }
    }
    for (const i in skippedOrders) {
      try {
        if (cumulativeSum < amount) {
          await this.orderService.deleteOrder(
            req,
            skippedOrders[i]._id.toString(),
          );
          deletedOrders++;
          processedOrders++;
          cumulativeSum += skippedOrders[i].summary.totalFee;
          if (processedOrders % 5 == 0) {
            batch.set({
              response: {
                processedOrders,
                totalOrders,
                deletedItems,
                deletedOrders,
                reducedShishaTax: roundOffNumber(cumulativeSum),
              },
            });
            await batch.save();
          }
        } else {
          break;
        }
      } catch (err) {
        console.log(
          `Error while processing reduce batch for skipped order ${skippedOrders[i]._id}`,
          err,
        );
      }
    }

    if (!batch.response) {
      batch.response = {
        processedOrders,
        totalOrders,
        deletedItems,
        deletedOrders,
        reducedShishaTax: roundOffNumber(cumulativeSum),
      };
    }
    batch.status = 'completed';
    await batch.save();
  }
  async massCreateInvoice(
    req,
    dto: CreateMassInvoiceDto,
    batch: BatchDocument,
  ) {
    let skip = 0,
      failed = 0;

    let invoiceCount = 0;
    let orderIdQuery = {};
    // if (dto.orderIds && dto.orderIds.length > 0) {
    //   orderIdQuery = {
    //     _id: {
    //       $in: dto.orderIds.map((id) => new mongoose.Types.ObjectId(id)),
    //     },
    //   };
    // }
    let queryToApply: any = {
      ...dto,

      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
    };

    if (dto.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${dto.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (dto.cashierLogIds && dto.cashierLogIds.length > 0) {
      queryToApply.cashierLogId = {
        $in: dto.cashierLogIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (dto.isInvoiced === true) {
      queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    } else if (dto.isInvoiced === false) {
      queryToApply.invoiceStatus = { $ne: InvoiceStatus.Invoiced };
    }
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      queryToApply['items.menuItem.menuItemId'] = {
        $in: dto.menuItemIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (dto.customerId) {
      queryToApply.customerId = new mongoose.Types.ObjectId(dto.customerId);
    }
    if (dto.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(dto.restaurantId);
    }
    if (dto.driverId) {
      queryToApply.driverId = new mongoose.Types.ObjectId(dto.driverId);
    }
    if (dto.tableId) {
      queryToApply.tableId = new mongoose.Types.ObjectId(dto.tableId);
    }
    if (dto.waiterId) {
      queryToApply.waiterId = new mongoose.Types.ObjectId(dto.waiterId);
    }

    if (dto.search) {
      queryToApply.$or = [
        { name: { $regex: dto.search, $options: 'i' } },
        { contactNumber: { $regex: dto.search, $options: 'i' } },
        { orderNumber: { $regex: dto.search, $options: 'i' } },
      ];
    }

    if (dto.notBelongingToTable) {
      queryToApply.tableId = null;
      delete queryToApply.notBelongingToTable;
    }
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.startDate = new Date(
        dto.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      dto.endDate = new Date(
        dto.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
      );

      queryToApply.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    const totalOrders = await this.orderModel.count(queryToApply);
    let lastOrderId = null;
    while (totalOrders > invoiceCount + failed) {
      if (lastOrderId) queryToApply._id = { $lt: lastOrderId };
      const orders = await this.fetchOrdersForBatch(dto, skip, 50, {
        ...queryToApply,
      });

      if (orders.length == 0) break;

      for (const i in orders) {
        try {
          lastOrderId = orders[i]._id;
          await this.create(req, {
            orderId: orders[i]._id,
            type: InvoiceType.Invoice,
          });
          invoiceCount++;
          //res.push(orders[i]._id);
          if (invoiceCount % 5 == 0) {
            batch.set({
              response: {
                invoiceCount,
                totalOrders,
                failed,
              },
            });
            await batch.save();
          }
        } catch (err) {
          failed++;
          console.log(
            `Error while processing mass invoice create batch for order ${orders[i]._id}`,
            err,
          );
        }
      }
    }

    if (!batch.response) {
      batch.response = {
        invoiceCount,
        totalOrders,
      };
    } else {
      batch.set({
        response: {
          invoiceCount,
          totalOrders,
        },
      });
    }
    batch.status = 'completed';
    await batch.save();
    return batch;
  }

  async massCreate(req, dto: CreateMassInvoiceDto) {
    let cumulativeSum = 0,
      skip = 0,
      amount = dto.amount;
    const res = [];
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
        if (cumulativeSum >= amount) break;

        try {
          await this.create(req, {
            orderId: orders[i]._id,
            type: InvoiceType.Invoice,
          });
          res.push(orders[i]._id);
          cumulativeSum += orders[i].summary.totalWithTax;
        } catch (err) {
          console.log(`Invoice exists for ${orders[i]._id}`);
        }
      }
    }
    return res;
  }

  async massCancel(req, dto: CreateMassInvoiceDto) {
    let cumulativeSum = 0,
      skip = 0,
      amount = dto.amount;
    const res = [];
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
          await this.cancel(req, orders[i]._id, 'order');
          res.push(orders[i]._id);
          cumulativeSum += orders[i].summary.totalWithTax;
        } catch (err) {
          console.log(`Invoice does not exists for ${orders[i]._id}`);
        }
      }
    }
    return res;
  }

  async massReceiptDelete(req, dto: CreateMassInvoiceDto) {
    let cumulativeSum = 0,
      skip = 0,
      amount = dto.amount;
    const res = [];
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
          await this.invoiceModel.deleteMany({
            orderId: orders[i]._id,
            type: InvoiceType.Receipt,
          });
          orders[i].receipts = [];
          orders[i].save();
          res.push(orders[i]._id);
          cumulativeSum += orders[i].summary.totalWithTax;
        } catch (err) {
          console.log(`Receipts delete failed for ${orders[i]._id}`);
        }
      }
    }
    return res;
  }

  async fetchOrdersForBatch(dto: any, skip = 0, limit = 20, query = {}) {
    let orderIdQuery = {};
    if (dto.orderIds && dto.orderIds.length > 0) {
      orderIdQuery = {
        _id: {
          $in: dto.orderIds,
        },
      };
    }
    const orders = await this.orderModel.find(
      { ...orderIdQuery, ...query },
      {},
      {
        skip,
        limit,
        sort: { _id: -1 },
      },
    );
    console.log(orders);
    return orders;
  }

  async generateCommands(req, query: EscCommandsDto) {
    let commands = null;

    if (query.type == InvoiceType.Invoice) {
      const invoice = await this.invoiceModel.findOne({
        orderId: query.orderId,
      });
      if (!invoice) {
        throw new BadRequestException(VALIDATION_MESSAGES.InvoiceNotFound.key);
      }
      commands = await this.invoiceHelperService.generateEscCommandsForInvoice(
        invoice.imageUrl,
      );
      commands = Object.values(commands);
    } else if (query.type == InvoiceType.KitchenReceipt) {
      const order = await this.orderModel.findById(query.orderId);
      const kitchenReceipt = order.kitchenReceipts.find((r) => {
        return r.printerId.toString() == query.printerId;
      });
      if (!kitchenReceipt) {
        throw new BadRequestException(VALIDATION_MESSAGES.InvoiceNotFound.key);
      }
      commands = await this.invoiceHelperService.generateEscCommandsForInvoice(
        kitchenReceipt.url,
      );
    }
    return commands;
  }
  async printInvoice(req, query: PrintInvoiceDto) {
    let response = [];
    let cashierPrinter = null;
    const order = await this.orderModel.findById(query.orderId).populate([
      {
        path: 'supplierId',
      },
      {
        path: 'restaurantId',
      },
      {
        path: 'tableId',
      },
    ]);
    let queryToApply: any = {};
    if (order?.restaurantId._id && order?.restaurantId._id != '') {
      queryToApply =
        { availableRestaurants: { $in: order?.restaurantId._id } }
    }
    cashierPrinter = await this.printerModel.findOne({
      isDefault: true,
      type: PrinterType.Cashier,
      supplierId: req.user.supplierId,
      ...queryToApply
    });
    if (!cashierPrinter) {
      cashierPrinter = await this.printerModel.findOne({
        isDefault: true,
        type: PrinterType.Cashier,
        supplierId: req.user.supplierId,
      });
    }
    if (!query.type || query.type == PrinterType.Receipt) {

      if (!cashierPrinter && query.type) {
        throw new BadRequestException(`No Cashier Printer Found`);
      }
      const receipt = await this.invoiceModel.findOne(
        {
          orderId: query.orderId,
          type: InvoiceType.Receipt,
        },
        {},
        { sort: { _id: -1 } },
      );
      if (!receipt && query.type) {
        throw new BadRequestException(VALIDATION_MESSAGES.InvoiceNotFound.key);
      }
      if (receipt)
        await this.socketGateway.emit(req.user.supplierId, SocketEvents.print, {
          printer: cashierPrinter.toObject(),
          url: receipt.imageUrl,
        });
    }
    if (!query.type || query.type == PrinterType.Cashier) {
      if (!cashierPrinter) {
        cashierPrinter = await this.printerModel.findOne({
          isDefault: true,
          type: PrinterType.Cashier,
          supplierId: req.user.supplierId,
        });
      }
      if (!cashierPrinter && query.type) {
        throw new BadRequestException(`No Cashier Printer Found`);
      }
      const invoice = await this.invoiceModel.findOne(
        {
          orderId: query.orderId,
          type: InvoiceType.Invoice,
        },
        {},
        { sort: { _id: -1 } },
      );
      if (!invoice && query.type) {
        throw new BadRequestException(VALIDATION_MESSAGES.InvoiceNotFound.key);
      }
      // let commands =
      //   await this.invoiceHelperService.generateEscCommandsForInvoice(
      //     invoice.imageUrl,
      //   );
      // commands = Object.values(commands);
      // await this.socketGateway.emit(
      //   invoice.supplierId.toString(),
      //   SocketEvents.print,
      //   {
      //     place: printer._id.toString(),
      //     commands,
      //   },
      //   `${invoice.supplierId.toString()}_PRINT`,
      // );
      // response.push({
      //   printer,
      //   url: invoice.imageUrl,
      // });
      if (invoice)
        await this.socketGateway.emit(req.user.supplierId, SocketEvents.print, {
          printer: cashierPrinter.toObject(),
          url: invoice.imageUrl,
        });
    }
    if (!query.type || query.type == PrinterType.Kitchen) {
      const order = await this.orderModel.findById(query.orderId).populate([
        {
          path: 'kitchenReceipts.printerId',
        },
      ]);
      if (order.kitchenReceipts?.length == 0) {
        const order = await this.orderModel.findById(query.orderId);
        this.orderHelperService.generateKitchenReceipts(order, true);
        throw new BadRequestException(`No Kitchen Printer Found, check Menu category printer setup & reprint`);
      }
      for (const i in order.kitchenReceipts) {

        if (!order.kitchenReceipts[i].printerId || order.kitchenReceipts[i].printerId == null) {
          // We are checking if some kitchen printer was deleted, reassign and print automatically same as order generation
          const order = await this.orderModel.findById(query.orderId);
          this.orderHelperService.generateKitchenReceipts(order, true);
          throw new BadRequestException(`No Kitchen Printer Found, check Menu category printer setup & reprint`);

        } else {
          await this.socketGateway.emit(req.user.supplierId, SocketEvents.print, {
            printer: order.kitchenReceipts[i].printerId,
            url: order.kitchenReceipts[i].url,
          });
        }

        // response.push({
        //   printer: order.kitchenReceipts[i].printerId,
        //   url: order.kitchenReceipts[i].url,
        // });
      }
    }
    return [];
  }


}
