import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import mongoose, {
  LeanDocument,
  Model,
  PaginateModel,
  PaginateResult,
} from 'mongoose';

import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

import { CashierLog, CashierLogDocument } from './schemas/cashier-log.schema';
import { EmpDebt, EmpDebtDocument } from 'src/employee-mgmt/schemas/emp-debt.schema';
import {
  CloseCashierDto,
  ExpenseDto,
  OpenCashierDto,
  OverrideCloseCashierDto,
} from './dto/cashier-log.dto';
import { PauseDto } from './dto/pause.dto';
import { Cashier, CashierDocument } from './schemas/cashier.schema';
import { CashierService } from './cashier.service';
import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import {
  Transaction,
  TransactionDocument,
} from 'src/transaction/schemas/transactions.schema';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { CashierHelperService } from './cashier-helper.service';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import {
  CashierLogReportDto,
  CashierReportDto,
} from './dto/cashier-report.dto';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { Invoice, InvoiceDocument } from 'src/invoice/schemas/invoice.schema';
import {
  convertUtcToSupplierTimezone,
  reduce,
} from 'src/core/Helpers/universal.helper';
import * as moment from 'moment';
import { OrderPaymentStatus, OrderStatus } from 'src/order/enum/en.enum';
import { PaymentStatus, PrintAction } from 'src/core/Constants/enum';
import { roundOffNumber } from '../core/Helpers/universal.helper';
import { Workbook } from 'exceljs';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { Type } from 'class-transformer';
import ObjectId from 'mongoose';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { match } from 'assert';
import {
  DeferredTransaction,
  DeferredTransactionDocument,
} from 'src/order/schemas/deferred-transaction.schema';
import { TemplateResolverService } from 'src/template-resolver/template-resolver.service';

import { Printer, PrinterDocument } from 'src/printer/schema/printer.schema';
import { PrinterType } from 'src/printer/enum/en';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import { InvoiceType } from 'src/invoice/invoice.enum';
import { NotificationHelperService } from 'src/notification/notification-helper.service';
import { OrderEvents } from 'src/notification/enum/en.enum';
import { CashierLogPrintDto } from './dto/cashierlog.dto';
import { EmpDebtService } from 'src/employee-mgmt/service/emp-debt.service';
import { CreateDebtEmpDto } from 'src/employee-mgmt/dto/create-emp-debt.dto';
import { DebtDocType, DebtPaymentStatus, DebtType, TransStatus } from 'src/core/Constants/enum';


@Injectable()
export class CashierLogService {
  constructor(
    @InjectModel(Cashier.name)
    private readonly cashierModel: Model<CashierDocument>,

    @InjectModel(CashierLog.name)
    private readonly cashierLogModel: Model<CashierLogDocument>,

    @InjectModel(CashierLog.name)
    private readonly cashierLogModelPag: PaginateModel<CashierLogDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,

    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Printer.name)
    private readonly printerModel: Model<PrinterDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @Inject(forwardRef(() => CashierService))
    private readonly cashierService: CashierService,
    @Inject(forwardRef(() => CashierHelperService))
    private readonly cashierHelperService: CashierHelperService,
    @InjectModel(DeferredTransaction.name)
    private readonly deferredTransactionModel: Model<DeferredTransactionDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    // @InjectModel(EmpDebt.name)
    // private readonly empDebtModel: Model<EmpDebtDocument>,
    private socketGateway: SocketIoGateway,
    private templateService: TemplateResolverService,
    private notificationHelperService: NotificationHelperService,
    private empDebtService: EmpDebtService,

  ) { }

  async findCurrentLog(cashierId: string): Promise<CashierLogDocument> {
    const exists = await this.cashierLogModel.findOne(
      { cashierId },
      {},
      { sort: { _id: -1 } },
    );
    return exists;
  }
  async getCashierIdByRestaurant(req: any): Promise<any> {
    const cashierData = await this.cashierModel.findOne({
      supplierId: req.user.supplierId,
      restaurantId: req.query.restaurantId
    });

    return cashierData;
  }
  async current(cashierId: string, onlyShift = false): Promise<any> {
    const exists = await this.findCurrentLog(cashierId);
    if (!exists) {
      return {};
    }
    let dashboard = null;
    if (!onlyShift) {
      await exists.populate([
        {
          path: 'transactions',
          populate: [
            {
              path: 'orderId',
              select: { items: 0 },
            },
          ],
        },
        {
          path: 'userId',
          select: {
            name: 1,
            _id: 1,
            phoneNumber: 1,
            email: 1,
            whatsappNumber: 1,
          },
        },
        {
          path: 'cashierId'
        }
      ]);
      dashboard = await this.cashierHelperService.prepareDashboardData(exists);
    }

    return {
      ...exists.toObject(),
      dashboard,
    };
  }

  async singleLog(cashierId: string, cashierLogId: string): Promise<any> {
    const exists = await this.cashierLogModel
      .findOne({ cashierId, _id: cashierLogId })
      .populate([
        {
          path: 'transactions',
          populate: [
            {
              path: 'orderId',
              select: {
                items: 0,
              },
            },
          ],
        },
        {
          path: 'userId',
          select: {
            name: 1,
            _id: 1,
            phoneNumber: 1,
            email: 1,
            whatsappNumber: 1,
          },
        },
        {
          path: 'cashierId'
        }
      ]);

    if (!exists) {
      throw new NotFoundException();
    }

    return {
      ...exists.toObject(),
      dashboard: await this.cashierHelperService.prepareDashboardData(exists),
    };
  }

  async logs(
    req: any,
    cashierId: string,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CashierLogDocument>> {
    const cashierLogs: any = await this.cashierLogModelPag.paginate(
      {
        cashierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          // {
          //   path: 'transactions',
          //   populate: [
          //     {
          //       path: 'orderId',
          //       select: { orderNumber: 1 },
          //     },
          //   ],
          // },
          {
            path: 'userId',
            select: {
              name: 1,
              _id: 1,
              phoneNumber: 1,
              email: 1,
              whatsappNumber: 1,
            },
          },
          {
            path: 'cashierId'
          }
        ],
        allowDiskUse: true,
      },
    );
    // for (const i in cashierLogs.docs) {
    //   cashierLogs.docs[i].dashboard =
    //     await this.cashierHelperService.prepareDashboardData(
    //       cashierLogs.docs[i],
    //     );
    // }

    return cashierLogs;
  }

  async logsWithTransaction(
    req: any,
    cashierId: string,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CashierLogDocument>> {

    let queryToApply: any = {};
    if (req.query && req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.startedAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
    console.log("logsWithTransaction queryToApply", queryToApply);
    const cashierLogs: any = await this.cashierLogModelPag.paginate(
      {
        cashierId,
        ...queryToApply
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'transactions',
            populate: [
              {
                path: 'orderId',
                select: { orderNumber: 1 },
              },
            ],
          },
          {
            path: 'userId',
            select: {
              name: 1,
              _id: 1,
              phoneNumber: 1,
              email: 1,
              whatsappNumber: 1,
            },
          },
        ],
        allowDiskUse: true,
        select: 'startedAt closedAt transactions expenses openingBalance closingBalance closeCashierDashboard',
      },
    );
    return cashierLogs;
  }


  async start(req: any, dto: OpenCashierDto): Promise<CashierLogDocument> {
    let cashierId = null;
    if (dto.restaurantId) {
      const cashierData = await this.cashierModel.findOne({
        supplierId: req.user.supplierId,
        restaurantId: dto.restaurantId
      });
      if (cashierData) {
        cashierId = cashierData._id;
      }
    }
    else if (dto.cashierId) {
      cashierId = dto.cashierId
    };

    if (!cashierId) {
      // identify cashierId
      cashierId = await this.cashierHelperService.resolveCashierId(
        req,
        cashierId,
      );
    }
    console.log(cashierId);
    let cashierLog = await this.cashierLogModel.findOne(
      { cashierId },
      {},
      { sort: { _id: -1 } },
    );

    // if (cashierLog && !cashierLog.closedAt) {
    //   throw new BadRequestException(
    //     VALIDATION_MESSAGES.PreviousOpenInstance.key,
    //   );
    // }
    const imageNoteDto: any = {};
    if (dto.image) {
      imageNoteDto.images = [dto.image];
    }
    if (dto.note) {
      imageNoteDto.notes = [dto.note];
    }
    console.log(imageNoteDto);
    cashierLog = await this.cashierLogModel.create({
      ...dto,
      ...imageNoteDto,
      cashierId,
      currentBalance: dto.openingBalance,
      startedAt: new Date(),
      supplierId: req.user.supplierId,
      userId: req.user.userId,
    });
    this.cashierService.update(cashierId, { currentLog: cashierLog._id });
    return cashierLog;
  }

  async close(
    req: any,
    dto: CloseCashierDto | OverrideCloseCashierDto,
  ): Promise<CashierLogDocument> {
    let cashierId = null;

    if (dto.restaurantId) {
      const cashierData = await this.cashierModel.findOne({
        supplierId: req.user.supplierId,
        restaurantId: dto.restaurantId
      });
      if (cashierData) {
        cashierId = cashierData._id;
      }
    }
    else if (dto.cashierId) {
      cashierId = dto.cashierId
    };

    if (!cashierId) {
      // identify cashierId
      cashierId = await this.cashierHelperService.resolveCashierId(
        req,
        cashierId,
      );
    }
    const cashier = await this.cashierModel.findById(cashierId);
    if (!cashier) throw new NotFoundException();
    if (!cashier.currentLog) {
      throw new BadRequestException(VALIDATION_MESSAGES.NoOpenInstance.key);
    }
    const cashierLog = await this.cashierLogModel.findById(cashier.currentLog);


    const difference = dto.closingBalance - cashierLog.currentBalance;
    // validate balance
    if (!dto.overrideReason) {
      if (cashierLog.currentBalance != dto.closingBalance)
        throw new BadRequestException(
          `${VALIDATION_MESSAGES.NoBalanceMatch.key} ${difference}`,
        );
    }

    if (dto.image) {
      cashierLog.images.push(dto.image);
    }
    if (dto.note) {
      cashierLog.notes.push(dto.note);
    }

    cashierLog.set({
      ...dto,
      closedAt: new Date(),
      difference,
    });
    await cashierLog.save();
    // const fileUrls = await this.cashierLogPrint(req, {
    //   restaurantId: cashier.restaurantId.toString(),
    //   cashierId: cashier._id.toString(),
    // });
    await cashier.populate([{ path: 'restaurantId' }, { path: 'supplierId' }]);

    if (!cashier.supplierId.disableAutoCashierReceiptPrint) {
      const fileUrls = await this.printSingleCashier(req, cashierLog, cashier);
    }

    if (cashierLog?.closeCashierDashboard?.totalDifference < 0) {
      let empDebtData: EmpDebtDocument
      empDebtData = await this.empDebtAdd(req, dto, cashierLog);
    }
    return cashierLog;
  }

  private async empDebtAdd(req, dto, cashierLog): Promise<EmpDebtDocument> {

    try {
      let employee = await this.userModel.findById(req.user.userId);

      let debtData = new CreateDebtEmpDto();
      let note = `عجز الصندوق يوم ${moment().format('YYYY-MM-DD')}`

      debtData.cashierLogId = String(cashierLog._id);
      debtData.supplierId = req.user.supplierId;
      debtData.restaurantId = dto.restaurantId;
      debtData.empId = employee.employeeId ? String(employee.employeeId) : null;
      debtData.addedBy = req.user.userId;
      debtData.date = new Date();
      debtData.referenceNumber = null;
      debtData.attachment = null;
      debtData.notes = note;
      debtData.debtType = DebtType.Deficit;
      debtData.totalAmount = Math.abs(cashierLog.closeCashierDashboard.totalDifference);
      debtData.remainCost = Math.abs(cashierLog.closeCashierDashboard.totalDifference);
      debtData.totalPaid = 0;
      debtData.isDebtReversal = false;
      debtData.transType = TransStatus.Approved;
      debtData.referenceEmpDebtId = null;
      debtData.otherGLAccount = null;
      debtData.paymentStatus = DebtPaymentStatus.NotPaid;
      let empDebtData: EmpDebtDocument;
      empDebtData = await this.empDebtService.create(req, debtData);
      return empDebtData;
    } catch (err) {
      console.log(err)
      return null;
    }

  }

  async adhocCashierLogPrint(req, dto: CashierLogPrintDto) {
    const cashierLog = await this.cashierLogModel
      .findById(dto.cashierLogId)
      .populate([
        {
          path: 'cashierId',
          populate: {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          }
        },
      ]);
    if (!cashierLog) {
      throw new NotFoundException();
    }
    const fileUrls = await this.printSingleCashier(
      req,
      cashierLog,
      cashierLog.cashierId,
      dto.lang,
      true,
      true
    );
    if (dto.action == PrintAction.Email) {

      await this.notificationHelperService.triggerEmailNotification(null,
        dto.to?.split(';'), dto.emailbody, dto.emailSubject,
        [
          {
            filename: fileUrls,
          }
        ]
      );
    }

    return fileUrls;
  }

  async printSingleCashier(
    req,
    cashierLog: CashierLogDocument,
    cashier: CashierDocument,
    lang = "",
    isfullPage = false,
    isCustomerEmail = false
  ) {
    await cashierLog.populate([
      {
        path: 'transactions',
        populate: [
          {
            path: 'orderId',
          },

        ],
      },
      {
        path: 'cashierId'
      }
    ]);

    let orders: any = cashierLog.transactions.map((t) => t.orderId);
    orders = [...new Map(orders.map((o) => [o['_id'], o])).values()];
    let customers1: any = orders
      .filter((o) => o.customerId)
      .map((o) => o.customerId);

    let customers2: any = orders
      .filter((o) => o.contactNumber)
      .map((o) => o.contactNumber);

    // let customers3: any = orders
    //   .filter((o) => o.customerId || o.contactNumber || o.name)
    //   .map((o) => o.customerId);

    customers1 = new Set(customers1);

    customers2 = new Set(customers2);

    const totalCustomers = customers1?.size + customers2?.size;
    console.log(customers1, customers2, totalCustomers);
    const totalFee = orders.reduce((acc, o) => {
      if (o.feeRate == 100 || o.isShishaFeeApplicable == true) {
        return o.summary.taxableFee + acc;
      }
    }, 0);
    const totalTax = orders.reduce((acc, o) => acc + o.summary.totalTax, 0);
    const netSalesWithoutTax = orders.reduce(
      (acc, o) =>
        acc + o.summary.totalTaxableAmount - (o.summary.taxableFee ?? 0),
      0,
    );

    console.log("cashierLog", cashierLog);
    let firstOrder = await this.orderModel
      .findOne({ cashierLogId: cashierLog._id }, {}, { sort: { _id: 1 } })

      .lean();

    let lastOrder = await this.orderModel
      .findOne({ cashierLogId: cashierLog._id }, {}, { sort: { _id: -1 } })

      .lean();

    const dashboard: any = await this.cashierHelperService.prepareDashboardData(
      cashierLog,
    );
    console.log("dashboard", dashboard);
    const averageCart = dashboard.totalSales / orders.length;
    let averagePerPerson = averageCart;
    if (totalCustomers > 0) {
      averagePerPerson = dashboard.totalSales / totalCustomers;
    }

    // const salesByCategory = await this.orderModel.aggregate([
    //   {
    //     $match: {
    //       _id: { $in: orders.map((o) => o._id) },
    //     },
    //   },

    //   { $unwind: '$items' },
    //   {
    //     $lookup: {
    //       from: 'menuitems',
    //       localField: 'items.menuItem.menuItemId',
    //       foreignField: '_id',
    //       as: 'items.menuItemObj',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'menucategories',
    //       localField: 'items.menuItemObj.categoryId',
    //       foreignField: '_id',
    //       as: 'items.category',
    //     },
    //   },
    //   {
    //     $addFields: {
    //       'items.category': {
    //         $first: '$items.category',
    //       },
    //     },
    //   },

    //   {
    //     $group: {
    //       _id: '$items.category._id',
    //       quantitiesSold: { $sum: '$items.quantity' },
    //       // grossAmount: { $sum: '$items.amountBeforeDiscount' },
    //       // discount: { $sum: '$items.discount' },
    //       amountAfterDiscount: { $sum: '$items.amountAfterDiscount' },
    //       // tax: { $sum: '$items.tax' },
    //       category: { $first: '$items.category.name' },
    //       categoryAr: { $first: '$items.category.nameAr' },

    //     },
    //   },
    // ]);

    const salesByItem = await this.orderModel.aggregate([
      {
        $match: {
          _id: { $in: orders.map((o) => o._id) },
          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
          },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'items.menuItem.categoryId',
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
        $group: {
          _id: {
            itemId: '$items.menuItem.menuItemId',
            categoryId: '$items.menuItem.categoryId',
          },
          name: { $first: '$items.menuItem.name' },
          nameAr: { $first: '$items.menuItem.nameAr' },
          quantitiesSold: { $sum: '$items.quantity' },
          amountAfterDiscount: { $sum: '$items.amountAfterDiscount' },
          category: { $first: '$items.category.name' },
          categoryAr: { $first: '$items.category.nameAr' },
        },
      },
      {
        $group: {
          _id: {
            categoryId: '$_id.categoryId',
            category: '$category',
            categoryAr: '$categoryAr',
          },
          items: {
            $push: {
              menuItemId: '$_id.itemId',
              name: '$name',
              nameAr: '$nameAr',
              quantitiesSold: '$quantitiesSold',
              amountAfterDiscount: '$amountAfterDiscount',
            },
          },
        },
      },
    ]);

    const salesByType = await this.orderModel.aggregate([
      {
        $match: {
          _id: { $in: orders.map((o) => o._id) },
          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
          },
        },
      },

      {
        $group: {
          _id: '$orderType',

          orderCount: { $sum: 1 },
          total: { $sum: '$summary.totalWithTax' },
        },
      },
    ]);

    const payments = await this.transactionModel.aggregate([
      {
        $match: {
          orderId: { $in: orders.map((o) => o._id) },
        },
      },

      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },

          orderCount: { $addToSet: '$orderId' },
        },
      },
      {
        $project: {
          paymentMethod: 1,
          total: 1,
          orderCount: { $size: '$orderCount' },
        },
      },
    ]);

    const discountedSales = await this.orderModel.aggregate([
      {
        $match: {
          _id: { $in: orders.map((o) => o._id) },

          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
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
          total: { $sum: '$summary.totalWithTax' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const bundlePrice = await this.orderModel.aggregate([
      {
        $match: {
          _id: { $in: orders.map((o) => o._id) },
          paymentStatus: {
            $nin: [OrderPaymentStatus.NotPaid, OrderPaymentStatus.Pending],
          },
        },
      },
      { $unwind: "$bundles" },
      { $unwind: "$bundles.bundleSubGroups" },
      { $unwind: "$bundles.bundleSubGroups.items" },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'bundles.bundleSubGroups.items.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$category', 0] },
        },
      },
      {
        $group: {
          _id: {
            itemId: '$bundles.bundleSubGroups.items.menuItemId',
            categoryId: '$bundles.bundleSubGroups.items.categoryId',
          },
          name: { $first: "$bundles.bundleSubGroups.items.name" },
          nameAr: { $first: "$bundles.bundleSubGroups.items.nameAr" },
          quantitiesSold: { $sum: '$bundles.bundleSubGroups.items.quantity' },
          amountAfterDiscount: { $sum: '$bundles.bundleSubGroups.items.unitPriceAfterDiscount' },
          category: { $first: '$category.name' },
          categoryAr: { $first: '$category.nameAr' },
        }
      },
      {
        $group: {
          _id: {
            categoryId: '$_id.categoryId',
            category: '$category',
            categoryAr: '$categoryAr',
          },
          items: {
            $push: {
              menuItemId: '$_id.itemId',
              name: '$name',
              nameAr: '$nameAr',
              quantitiesSold: '$quantitiesSold',
              amountAfterDiscount: '$amountAfterDiscount',
            },
          },
        }
      }
    ]);

    // console.log("salesByItem", JSON.stringify(salesByItem));
    // console.log("bundlePrice", JSON.stringify(bundlePrice));

    // Combine the arrays
    const combinedArray = [...salesByItem, ...bundlePrice];
    // console.log("groupedByCategoryIdAndMenuItemId", JSON.stringify(combinedArray));

    // Create a new array to store grouped items
    const newArray = [];

    // Object to store items based on categoryId
    const groupedItems = {};

    // Iterate through the original array
    combinedArray.forEach(obj => {
      const categoryId = obj._id.categoryId;
      if (!groupedItems[categoryId]) {
        // If categoryId is not present, initialize with an empty array
        groupedItems[categoryId] = [];
      }
      // Push items into the corresponding categoryId array
      groupedItems[categoryId].push(...obj.items);
    });

    // Convert groupedItems object back to an array
    for (const categoryId in groupedItems) {
      newArray.push({
        categoryId: categoryId,
        items: groupedItems[categoryId]
      });
    }

    // console.log("newArray", JSON.stringify(newArray));

    const salesByItemResult = [];
    newArray.forEach(category => {
      const catData = combinedArray.find((f) => f._id.categoryId == category.categoryId);

      const categoryResult = {
        _id: {
          categoryId: category.categoryId,
          category: catData?._id?.category,
          categoryAr: catData._id?.categoryAr,
        },
        items: [],
        totalQuantitiesSold: 0,
        totalAmountAfterDiscount: 0
      };

      category.items.forEach(item => {
        const existingItemIndex = categoryResult.items.findIndex(i => i.menuItemId?.toString() === item.menuItemId?.toString());
        if (existingItemIndex !== -1) {
          categoryResult.items[existingItemIndex].quantitiesSold += Number(item.quantitiesSold);
          categoryResult.items[existingItemIndex].amountAfterDiscount += Number(item.amountAfterDiscount?.toFixed(2));
          categoryResult.totalQuantitiesSold += Number(item.quantitiesSold);
          categoryResult.totalAmountAfterDiscount += Number(item.amountAfterDiscount?.toFixed(2));
        } else {
          categoryResult.items.push({
            menuItemId: item.menuItemId,
            name: item.name,
            nameAr: item.nameAr,
            quantitiesSold: Number(item.quantitiesSold),
            amountAfterDiscount: Number(item.amountAfterDiscount?.toFixed(2))
          });
          categoryResult.totalQuantitiesSold += Number(item.quantitiesSold);
          categoryResult.totalAmountAfterDiscount += Number(item.amountAfterDiscount?.toFixed(2));
        }
        categoryResult.totalAmountAfterDiscount = Number(categoryResult.totalAmountAfterDiscount?.toFixed(2));
      });

      salesByItemResult.push(categoryResult);
    });

    //console.log("salesByItemResult ++++ ", JSON.stringify(salesByItemResult));

    const salesByCategory = [];
    salesByItemResult.forEach(item => {
      salesByCategory.push({
        categoryAr: item._id?.categoryAr,
        category: item._id?.category,
        quantitiesSold: item.totalQuantitiesSold,
        amountAfterDiscount: item.totalAmountAfterDiscount?.toFixed(2)
      })
    });


    const allOrders = await this.orderModel
      .find({
        cashierLogId: cashierLog._id,
      })
      .populate([{ path: 'tableId' }])
      .lean();

    const cancelledSummary = allOrders.filter(
      (o) => o.status == OrderStatus.Cancelled,
    );

    const unpaidOrders = allOrders.filter(
      (o) => o.paymentStatus == OrderPaymentStatus.NotPaid,
    );

    const invoiceCount = await this.invoiceModel.count({
      orderId: { $in: allOrders.map((o) => o._id) },
      type: InvoiceType.Invoice,
    });

    const firstInvoice = await this.invoiceModel.findOne(
      {
        orderId: { $in: allOrders.map((o) => o._id) },
        type: InvoiceType.Invoice,
      },
      {},
      { sort: { _id: 1 } },
    );

    const lastInvoice = await this.invoiceModel.findOne(
      {
        orderId: { $in: allOrders.map((o) => o._id) },
        type: InvoiceType.Invoice,
      },
      {},
      { sort: { _id: -1 } },
    );

    const data = {
      allOrders,
      invoiceCount,
      unpaidOrders,
      cancelledSummary,
      salesByItem: salesByItemResult,
      salesByCategory,
      salesByType,
      averageCart: roundOffNumber(averageCart),
      averagePerPerson: roundOffNumber(averagePerPerson),
      ...dashboard,
      firstOrder,
      lastOrder,
      firstInvoiceNumber: firstInvoice?.invoiceNumber,
      lastInvoiceNumber: lastInvoice?.invoiceNumber,
      totalTax: roundOffNumber(totalTax),
      netSalesWithoutTax: roundOffNumber(netSalesWithoutTax),
      totalCustomers: totalCustomers,
      totalFee: roundOffNumber(totalFee),
      payments,
      discountedSales,
      enteredCardAmount: cashierLog?.closeCashierDashboard?.enteredCardAmount,
      enteredCashAmount: cashierLog?.closeCashierDashboard?.enteredCashAmount,
      cashDifference: cashierLog?.closeCashierDashboard?.cashDifference,
      cardDifference: cashierLog?.closeCashierDashboard?.cardDifference,
      totalDifference: cashierLog?.closeCashierDashboard?.totalDifference,

      salesPaidWithHungerStation: cashierLog?.closeCashierDashboard?.salesPaidWithHungerStation,
      salesPaidWithJahezSales: cashierLog?.closeCashierDashboard?.salesPaidWithJahezSales,
      salesPaidWithOtherSales: cashierLog?.closeCashierDashboard?.salesPaidWithOtherSales,
      salesPaidWithToyoSales: cashierLog?.closeCashierDashboard?.salesPaidWithToyoSales,
    };

    //console.log("dashboard", data.dashboard);

    let fileUrls;
    //console.log('cashier', cashier.toObject());
    const printer = await this.printerModel
      .findOne({
        supplierId: req.user.supplierId,
        type: PrinterType.Cashier,
        isDefault: true,
      })
      .lean();


    if (lang == "") {
      lang = cashier.supplierId.cashierReceiptLanguage ?
        cashier.supplierId.cashierReceiptLanguage : "ar";
    }

    if (!isfullPage) {
      fileUrls = await this.templateService.render(
        'src/template-resolver/templates/single-cashier.log.v3.html',
        { cashierData: data, cashier: cashier.toObject(), date: new Date(), lang: lang },
        req.user.supplierId + '/cashier-logs/',
        false,
      );
      if (printer && fileUrls) {
        this.socketGateway.emit(req.user.supplierId, SocketEvents.print, {
          printer,
          url: fileUrls.imageUrl,
        });
      }
      if (data.salesByItem && data.salesByItem?.length > 0) {
        const itemFileUrls = await this.templateService.render(
          'src/template-resolver/templates/single-cashier.item.v1.html',
          { cashierData: data, cashier: cashier.toObject(), date: new Date() },
          req.user.supplierId + '/cashier-logs/',
          false,
        );

        if (printer && itemFileUrls) {
          this.socketGateway.emit(req.user.supplierId, SocketEvents.print, {
            printer,
            url: itemFileUrls.imageUrl,
          });
        }
      }
    }
    else {
      fileUrls = await this.templateService.render(
        'src/template-resolver/templates/single-cashier.full.html',
        { cashierData: data, cashier: cashier.toObject(), date: new Date(), lang: lang },
        req.user.supplierId + '/cashier-logs/',
        false,
      );
    }

    // send email
    if (!isCustomerEmail) {
      this.notificationHelperService.triggerNotification(
        cashier.supplierId._id.toString(),
        OrderEvents.CashierClose,
        {
          recipients: [cashier.supplierId.email],
          attachments: [
            {
              filename: fileUrls.pdfUrl,
            },
          ],
          RestaurantName: cashier.supplierId.nameAr,
        },
      );
    }

    return fileUrls.pdfUrl;
  }

  async pause(
    cashierId: string,
    dto: PauseDto = null,
  ): Promise<CashierLogDocument> {
    const cashierLog = await this.cashierLogModel.findOne(
      { cashierId },
      {},
      { sort: { _id: -1 } },
    );
    if (!cashierLog) {
      throw new NotFoundException();
    }
    if (dto) {
      if (cashierLog.pausedLogs.length > 0) {
        const lastItem = cashierLog.pausedLogs.at(-1);
        if (!lastItem.end) {
          throw new BadRequestException(VALIDATION_MESSAGES.AlreadyPaused.key);
        }
      }
      cashierLog.pausedLogs.push({ ...dto, start: new Date() });
    } else {
      if (cashierLog.pausedLogs.length == 0) {
        throw new BadRequestException(VALIDATION_MESSAGES.NothingToResume.key);
      }
      const lastItem = cashierLog.pausedLogs.at(-1);
      if (lastItem.end) {
        throw new BadRequestException(VALIDATION_MESSAGES.NothingToResume.key);
      }
      lastItem.end = new Date();
      cashierLog.pausedLogs[cashierLog.pausedLogs.length - 1] = lastItem;
    }
    await cashierLog.save();

    return cashierLog;
  }

  async logTransactionAsync(
    cashierId: string,
    transactionId: string,
  ): Promise<void> {
    const activeShift = await this.current(cashierId, true);
    await this.cashierLogModel.findOneAndUpdate(
      { _id: activeShift._id },
      { $push: { transactions: transactionId } },
    );
  }

  async storeCurrentBalance(
    cashierId,
    transaction: LeanDocument<TransactionDocument>,
  ) {
    const activeShift = await this.current(cashierId);
    await this.cashierLogModel.findOneAndUpdate(
      { _id: activeShift._id },
      {
        $inc: {
          currentBalance: transaction.isRefund
            ? -1 * transaction.amount
            : transaction.amount,
        },
      },
    );

    this.socketGateway.emit(
      transaction.supplierId.toString(),
      SocketEvents.Cashier,
      { cashierId: transaction.cashierId, refresh: true },
    );
  }

  async storeExpense(req, cashierId: string, dto: ExpenseDto) {
    const log = await this.findCurrentLog(cashierId);
    log.expenses.push({ ...dto, addedBy: req.user.userId });
    await log.save();
    this.socketGateway.emit(
      req.user.supplierId.toString(),
      SocketEvents.Cashier,
      {
        cashierId: cashierId,
        refresh: true,
      },
    );
    return log;
  }

  async removeExpense(req, cashierId: string, expenseId: string) {
    const log = await this.findCurrentLog(cashierId);
    log.expenses = log.expenses.filter(
      (e: any) => e._id.toString() != expenseId,
    );
    await log.save();
    return log;
  }

  async autoStartCashier(req, cashier: CashierDocument) {
    const cashierLog = await this.cashierLogModel.create({
      cashierId: cashier._id,
      openingBalance: 0,
      currentBalance: 0,
      startedAt: new Date(),
      supplierId: cashier.supplierId,
      userId: req ? req.user.userId : null,
    });
    this.cashierService.update(cashier._id, { currentLog: cashierLog._id });
  }

  async orderReport(req, query: CashierReportDto, isFile = false) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    const queryToApply: any = {};
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
      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }
    if (query.restaurantId) {
      queryToApply.restaurantId = query.restaurantId;
    }
    console.log({
      createdAt: {
        $gte: query.startDate,
        $lte: query.endDate,
      },
    });
    const cashierLogs: any = await this.cashierLogModel
      .find({
        supplierId: req.user.supplierId,
        ...queryToApply,
      })
      .populate([
        {
          path: 'transactions',
          match: {
            createdAt: {
              $gte: query.startDate,
              $lte: query.endDate,
            },
            status: PaymentStatus.Success,
          },
          populate: [
            {
              path: 'orderId',
            },
            {
              path: 'addedBy',
            },
          ],
        },
        {
          path: 'userId',
        },
        {
          path: 'expenses.addedBy',
        },
      ]);

    const deferredTransactions = await this.deferredTransactionModel
      .find({
        supplierId: req.user.supplierId,
        ...queryToApply,
      })
      .populate([
        {
          path: 'addedBy',
        },
      ]);

    const response: any = [],
      records: any = [
        [
          'Order Number',
          'Invoice Number',
          'Date',
          'Time',
          'Paid Amount',
          'Payment Method',
          'Invoice Links',
          'User Names',
          'Cashier Log (Shift)',
        ],
        [
          'رقم الطلب',
          'رقم الفاتورة',
          'التاريخ',
          'الوقت',
          'المبلغ المدفوع',
          'طريقة الدفع',
          'الفاتورة',
          'اسم الموظف',
          'الشفت',
        ],
      ];
    const book = new Workbook();
    const sheet = book.addWorksheet('Transactions');
    let cash = 0,
      card = 0,
      online = 0,
      deferred = 0,
      refund = 0,
      expense = 0;
    for (const i in cashierLogs) {
      for (const j in cashierLogs[i].transactions) {
        const order = response.find(
          (o) => o.orderNumber == cashierLogs[i].transactions[j].orderNumber,
        );
        if (
          !order &&
          cashierLogs[i].transactions[j].status == PaymentStatus.Success
        ) {
          const invoices = await this.invoiceModel.find(
            {
              orderId: cashierLogs[i].transactions[j].orderId._id,
            },
            {},
            { sort: { _id: -1 } },
          );
          const date = convertUtcToSupplierTimezone(
            cashierLogs[i].transactions[j].createdAt,
            timezone,
          );
          const row = {
            orderNumber: cashierLogs[i].transactions[j].orderId.orderNumber,
            invoiceNumber: invoices.length > 0 ? invoices[0].invoiceNumber : '',
            date: moment(date).format('DD/MM/YYYY'),
            time: moment(date).format('hh:mm A'),
            totalPaid: roundOffNumber(
              cashierLogs[i].transactions[j].amount *
              (cashierLogs[i].transactions[j].isRefund ? -1 : 1),
            ),
            paymentMethod: cashierLogs[i].transactions[j].paymentMethod,
            invoiceLinks: invoices.map((i) => i.imageUrl).join(','),
            user: cashierLogs[i]?.transactions[j]?.addedBy?.name ?? 'N/A',

            shift: moment
              .utc(cashierLogs[i].startedAt)
              .tz(timezone)
              .format('DD/MM/yyyy hh:mm a'),
          };
          response.push(row);
          if (isFile) {
            records.push(Object.values(row));
          }
          if (cashierLogs[i].transactions[j].isRefund) {
            refund += cashierLogs[i].transactions[j].amount;
          } else if (
            cashierLogs[i].transactions[j].paymentMethod == PaymentMethod.Card
          ) {
            card += cashierLogs[i].transactions[j].amount;
          } else if (
            cashierLogs[i].transactions[j].paymentMethod == PaymentMethod.Cash
          ) {
            cash += cashierLogs[i].transactions[j].amount;
          } else if (
            cashierLogs[i].transactions[j].paymentMethod == PaymentMethod.Online
          ) {
            online += cashierLogs[i].transactions[j].amount;
          }
        }
      }
      for (const j in cashierLogs[i].expenses) {
        const date = convertUtcToSupplierTimezone(
          cashierLogs[i].expenses[j].createdAt,
          timezone,
        );
        const row = {
          orderNumber: '',
          invoiceNumber: '',
          date: moment(date).format('DD/MM/YYYY'),
          time: moment(date).format('hh:mm A'),
          totalPaid: roundOffNumber(cashierLogs[i].expenses[j].expense * -1),
          paymentMethod: 'Expense',
          invoiceLinks: '',
          user: cashierLogs[i]?.expenses[j]?.addedBy?.name ?? 'N/A',

          shift: moment
            .utc(cashierLogs[i].startedAt)
            .tz(timezone)
            .format('DD/MM/yyyy hh:mm a'),
        };
        response.push(row);
        if (isFile) {
          records.push(Object.values(row));
        }
        expense += cashierLogs[i].expenses[j].expense;
      }
    }

    for (const i in deferredTransactions) {
      console.log(deferredTransactions[i]);
      const date = convertUtcToSupplierTimezone(
        deferredTransactions[i].createdAt,
        timezone,
      );
      const row = {
        orderNumber: '',
        invoiceNumber: '',
        date: moment(date).format('DD/MM/YYYY'),
        time: moment(date).format('hh:mm A'),
        totalPaid: roundOffNumber(deferredTransactions[i].amount),
        paymentMethod: 'Deferred',
        invoiceLinks: '',
        user: deferredTransactions[i]?.addedBy?.name ?? 'N/A',

        shift: moment(date).format('DD/MM/yyyy hh:mm a'),
      };
      response.push(row);
      if (isFile) {
        records.push(Object.values(row));
      }
      deferred += deferredTransactions[i].amount;
    }
    response.push(
      {
        summaryLabel: 'Cash',
        value: cash,
      },
      {
        summaryLabel: 'Card',
        value: card,
      },
      {
        summaryLabel: 'Online',
        value: online,
      },
      {
        summaryLabel: 'Deferred',
        value: deferred,
      },
      {
        summaryLabel: 'Refunded',
        value: refund,
      },
      {
        summaryLabel: 'Expense',
        value: expense,
      },
    );
    records.push(
      ['Cash', cash],
      ['Card', card],
      ['Online', online],
      ['Deferred', deferred],
      ['Refunded', refund],
      ['Expense', expense],
    );

    if (!isFile) return response;
    sheet.addRows(records);
    const tmpFile = tmp.fileSync({
      mode: 0o644,
    });
    await book.xlsx.writeFile(tmpFile.name);
    const file = fs.createReadStream(tmpFile.name);
    return new StreamableFile(file);
  }

  async cashierReport(req, query: CashierReportDto, isFile = false) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    const queryToApply: any = {};
    const createdAtQuery: any = {};
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
      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }
    if (query.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(
        query.restaurantId,
      );
    }

    const cashierLogs: any = await this.cashierLogModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $lookup: {
          from: 'transactions',
          let: { transactions: '$transactions' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $in: ['$_id', '$$transactions'],
                    },
                    status: PaymentStatus.Success,
                    ...createdAtQuery,
                  },
                ],
              },
            },
          ],

          as: 'transactions',
        },
      },
      {
        $match: {
          transactions: { $ne: [] },
        },
      },

      {
        $unwind: '$transactions',
      },

      {
        $group: {
          _id: {
            userId: '$transactions.addedBy',
            paymentMethod: '$transactions.paymentMethod',
            startedAt: '$startedAt',
            closedAt: '$closedAt',
          },
          //totalExpenses: { $sum: '$expenses.amount' },
          sales: {
            $sum: '$transactions.amount',
          },
        },
      },
      {
        $sort: { '_id.startedAt': -1 },
      },
    ]);

    const expenses: any = await this.cashierLogModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          expenses: { $exists: true, $not: { $size: 0 }, $ne: null },
        },
      },

      {
        $unwind: '$expenses',
      },

      {
        $group: {
          _id: {
            userId: '$expenses.addedBy',
            startedAt: '$startedAt',
            closedAt: '$closedAt',
          },

          expense: {
            $sum: '$expenses.amount',
          },
        },
      },
    ]);

    const deferredTransactions = await this.deferredTransactionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $addFields: {
          y: { $year: { date: '$createdAt', timezone } },
          m: { $month: { date: '$createdAt', timezone } },
          d: { $dayOfMonth: { date: '$createdAt', timezone } },
          h: { $hour: { date: '$createdAt', timezone } },
        },
      },
      {
        $group: {
          _id: {
            userId: '$addedBy',
            year: '$y',
            month: '$m',
            day: '$d',
            hour: '$h',
          },

          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);
    console.log(deferredTransactions);
    const book = new Workbook();
    const sheet = book.addWorksheet('Transactions');
    const response = [],
      records = [
        [
          'User Names',
          'Cash Sales',
          'Card Sales',
          'Total Expenses',
          'Net Cash',
          'Shift',
        ],
        [
          'اسم الموظف',
          'مبيعات كاش',
          'مبيعات شبكة',
          'مصروفات',
          'صافي الكاش',
          'الشفت',
        ],
      ];
    let users = await this.userModel.find(
      {
        _id: {
          $in: cashierLogs
            .map((c) => c._id?.userId)
            .concat(expenses.map((e) => e._id?.userId))
            .concat(deferredTransactions.map((d) => d._id?.userId)),
        },
      },
      { name: 1, _id: 1 },
    );
    users = users.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);
    let cashierRecords = [];
    cashierLogs.forEach((element) => {
      if (
        !cashierRecords[
        `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
        }`
        ]
      ) {
        cashierRecords[
          `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
          }`
        ] = {
          _id: element._id,
        };
      }

      if (element?._id?.paymentMethod == PaymentMethod.Card) {
        cashierRecords[
          `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
          }`
        ].cardSales = element.sales;
      } else if (element?._id?.paymentMethod == PaymentMethod.Cash) {
        cashierRecords[
          `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
          }`
        ].cashSales = element.sales;
      }
    });
    expenses.forEach((element) => {
      if (element.expense > 0) {
        if (
          !cashierRecords[
          `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
          }`
          ]
        ) {
          cashierRecords[
            `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
            }`
          ] = {
            _id: element._id,
          };
        }
        cashierRecords[
          `${element?._id?.userId?.toString()}_${element?._id?.startedAt}_${element?._id?.closedAt
          }`
        ].expense = element.expense;
      }
    });

    deferredTransactions.forEach((element) => {
      const index = cashierRecords.findIndex((o) => {
        if (o._id.userId.toString() == element._id.userId.toString()) {
          const date = moment(
            `${element._id?.year}-${element._id?.month}-${element._id?.day} ${element._id?.hour}:00`,
          );
          const startedAt = moment(o._id.startedAt);
          const closedAt = o._id.closedAt ? moment(o._id.closedAt) : null;

          if (closedAt) {
            return date.isBetween(startedAt, closedAt);
          } else {
            return date.isSameOrBefore(startedAt);
          }
        }
      });
      if (index == -1) {
        cashierRecords[
          `${element?._id?.userId?.toString()}_${element?._id?.year}_${element?._id?.month
          }_${element?._id?.day}`
        ] = {
          _id: {
            userId: element._id.userId,
            startedAt: new Date(
              `${element._id?.year}-${element._id?.month}-${element._id?.day} ${element._id?.hour}:00:00`,
            ),
            closedAt: new Date(
              `${element._id?.year}-${element._id?.month}-${element._id?.day} ${element._id?.hour}:00:00`,
            ),
          },
          deferred: element.amount,
        };
      } else {
        cashierRecords[index].deferred += element.amount;
      }
    });

    cashierRecords = Object.values(cashierRecords).sort(
      (a, b) => b._id.startedAt - a._id.startedAt,
    );

    for (const i in cashierRecords) {
      const row: any = {
        username:
          users[cashierRecords[i]?._id?.userId?.toString()]?.name ?? 'N/A',
        cashSales: roundOffNumber(cashierRecords[i].cashSales ?? 0),
        cardSales: roundOffNumber(cashierRecords[i].cardSales ?? 0),
        totalExpenses: roundOffNumber(cashierRecords[i].expense ?? 0),
        netCash: roundOffNumber(
          (cashierRecords[i].cashSales ?? 0) - (cashierRecords[i].expense ?? 0),
        ),
        deferred: roundOffNumber(cashierRecords[i].deferred ?? 0),
        totalSales: roundOffNumber(
          (cashierRecords[i].cashSales ?? 0) +
          (cashierRecords[i].cardSales ?? 0) +
          (cashierRecords[i].deferred ?? 0),
        ),
        shift: moment
          .utc(cashierRecords[i]._id.startedAt)
          .tz(timezone)
          .format('DD/MM/yyyy hh:mm a'),
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

  async cashierReportByUser(req, query: CashierReportDto, isFile = false) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    const queryToApply: any = {};
    const createdAtQuery: any = {};
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
      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }
    if (query.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(
        query.restaurantId,
      );
    }

    const transactions: any = await this.transactionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $group: {
          _id: {
            userId: '$addedBy',
            paymentMethod: '$paymentMethod',
          },
          //totalExpenses: { $sum: '$expenses.amount' },
          sales: {
            $sum: '$amount',
          },
        },
      },
    ]);

    console.log(transactions);

    // const expenses: any = await this.cashierLogModel.aggregate([
    //   {
    //     $match: {
    //       supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
    //       ...queryToApply,
    //       expenses: { $exists: true, $not: { $size: 0 }, $ne: null },
    //     },
    //   },

    //   {
    //     $unwind: '$expenses',
    //   },

    //   {
    //     $group: {
    //       _id: {
    //         userId: '$expenses.addedBy',
    //       },

    //       expense: {
    //         $sum: '$expenses.amount',
    //       },
    //     },
    //   },
    // ]);

    const deferredTransactions = await this.deferredTransactionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },

      {
        $group: {
          _id: {
            userId: '$addedBy',
          },

          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const book = new Workbook();
    const sheet = book.addWorksheet('Transactions');
    const response = [],
      records = [
        [
          'User Names',
          'Cash Sales',
          'Card Sales',
          'Total Expenses',
          'Net Cash',
          'Shift',
        ],
        [
          'اسم الموظف',
          'مبيعات كاش',
          'مبيعات شبكة',
          'مصروفات',
          'صافي الكاش',
          'الشفت',
        ],
      ];
    let users = await this.userModel.find(
      {
        _id: {
          $in: transactions
            .map((c) => c._id?.userId)
            //.concat(expenses.map((e) => e._id?.userId))
            .concat(deferredTransactions.map((d) => d._id?.userId)),
        },
      },
      { name: 1, _id: 1 },
    );
    users = users.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);
    const cashierRecords = [];
    transactions.forEach((element) => {
      if (!cashierRecords[element?._id?.userId?.toString()]) {
        cashierRecords[element?._id?.userId?.toString()] = {
          _id: element._id,
          cashSales: 0,
          cardSales: 0,
          deferred: 0,
        };
      }

      if (element?._id?.paymentMethod == PaymentMethod.Card) {
        cashierRecords[element?._id?.userId?.toString()].cardSales +=
          element.sales;
      } else if (element?._id?.paymentMethod == PaymentMethod.Cash) {
        cashierRecords[element?._id?.userId?.toString()].cashSales +=
          element.sales;
      }
    });
    // expenses.forEach((element) => {
    //   if (element.expense > 0) {
    //     if (
    //       !cashierRecords[
    //         `${element?._id?.userId?.toString()}
    //         }`
    //       ]
    //     ) {
    //       cashierRecords[
    //         `${element?._id?.userId?.toString()}
    //         }`
    //       ] = {
    //         _id: element._id,
    //       };
    //     }
    //     cashierRecords[
    //       `${element?._id?.userId?.toString()}
    //       }`
    //     ].expense += element.expense;
    //   }
    // });

    deferredTransactions.forEach((element) => {
      if (!cashierRecords[element?._id?.userId?.toString()]) {
        cashierRecords[element?._id?.userId?.toString()] = {
          _id: element._id,
          deferred: 0,
        };
      }
      cashierRecords[element?._id?.userId?.toString()].deferred +=
        element.amount;
    });

    for (const i in cashierRecords) {
      const row: any = {
        username:
          users[cashierRecords[i]?._id?.userId?.toString()]?.name ?? 'N/A',
        cashSales: roundOffNumber(cashierRecords[i].cashSales ?? 0),
        cardSales: roundOffNumber(cashierRecords[i].cardSales ?? 0),
        //totalExpenses: roundOffNumber(cashierRecords[i].expense ?? 0),
        // netCash: roundOffNumber(
        //   (cashierRecords[i].cashSales ?? 0) - (cashierRecords[i].expense ?? 0),
        // ),
        deferred: roundOffNumber(cashierRecords[i].deferred ?? 0),
        totalSales: roundOffNumber(
          (cashierRecords[i].cashSales ?? 0) +
          (cashierRecords[i].cardSales ?? 0) +
          (cashierRecords[i].deferred ?? 0),
        ),
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

  async cashierReportByWaiter(req, query: CashierReportDto, isFile = false) {
    const supplier = await this.supplierModel.findById(req.user.supplierId);
    const timezone = supplier?.timezone ?? TIMEZONE;
    const queryToApply: any = {};
    const createdAtQuery: any = {};
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
      queryToApply.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }
    if (query.restaurantId) {
      queryToApply.restaurantId = new mongoose.Types.ObjectId(
        query.restaurantId,
      );
    }

    const orders: any = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $lookup: {
          from: 'transactions',
          let: { transactions: '$transactions' },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $in: ['$_id', '$$transactions'],
                    },
                    status: PaymentStatus.Success,
                    ...createdAtQuery,
                  },
                ],
              },
            },
          ],

          as: 'transactions',
        },
      },
      {
        $match: {
          transactions: { $ne: [] },
        },
      },

      {
        $unwind: '$transactions',
      },

      {
        $group: {
          _id: {
            userId: '$waiterId',
            paymentMethod: '$transactions.paymentMethod',
          },
          //totalExpenses: { $sum: '$expenses.amount' },
          sales: {
            $sum: '$transactions.amount',
          },
        },
      },
    ]);

    // const expenses: any = await this.cashierLogModel.aggregate([
    //   {
    //     $match: {
    //       supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
    //       ...queryToApply,
    //       expenses: { $exists: true, $not: { $size: 0 }, $ne: null },
    //     },
    //   },

    //   {
    //     $unwind: '$expenses',
    //   },

    //   {
    //     $group: {
    //       _id: {
    //         userId: '$expenses.addedBy',
    //       },

    //       expense: {
    //         $sum: '$expenses.amount',
    //       },
    //     },
    //   },
    // ]);

    const deferredTransactions = await this.deferredTransactionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      {
        $unwind: '$order',
      },
      {
        $group: {
          _id: {
            userId: '$order.waiterId',
          },

          amount: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const book = new Workbook();
    const sheet = book.addWorksheet('Transactions');
    const response = [],
      records = [
        [
          'User Names',
          'Cash Sales',
          'Card Sales',
          'Total Expenses',
          'Net Cash',
          'Shift',
        ],
        [
          'اسم الموظف',
          'مبيعات كاش',
          'مبيعات شبكة',
          'مصروفات',
          'صافي الكاش',
          'الشفت',
        ],
      ];
    const userIds = orders
      .map((c) => {
        if (c._id?.userId != null) return c._id?.userId;
      })
      //.concat(expenses.map((e) => e._id?.userId))
      .concat(
        deferredTransactions.map((d) => {
          if (d._id?.userId != null) return d._id?.userId;
        }),
      );
    let users = await this.userModel.find(
      {
        _id: {
          $in: userIds,
        },
      },
      { name: 1, _id: 1 },
    );
    users = users.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);
    const cashierRecords = [];
    orders.forEach((element) => {
      if (!cashierRecords[element?._id?.userId?.toString()]) {
        cashierRecords[element?._id?.userId?.toString()] = {
          _id: element._id,
          cardSales: 0,
          cashSales: 0,
          deferred: 0,
        };
      }

      if (element?._id?.paymentMethod == PaymentMethod.Card) {
        cashierRecords[element?._id?.userId?.toString()].cardSales +=
          element.sales;
      } else if (element?._id?.paymentMethod == PaymentMethod.Cash) {
        cashierRecords[element?._id?.userId?.toString()].cashSales +=
          element.sales;
      }
    });
    // expenses.forEach((element) => {
    //   if (element.expense > 0) {
    //     if (
    //       !cashierRecords[
    //         `${element?._id?.userId?.toString()}
    //         }`
    //       ]
    //     ) {
    //       cashierRecords[
    //         `${element?._id?.userId?.toString()}
    //         }`
    //       ] = {
    //         _id: element._id,
    //       };
    //     }
    //     cashierRecords[
    //       `${element?._id?.userId?.toString()}
    //       }`
    //     ].expense += element.expense;
    //   }
    // });

    deferredTransactions.forEach((element) => {
      if (!cashierRecords[element?._id?.userId?.toString()]) {
        cashierRecords[element?._id?.userId?.toString()] = {
          _id: element._id,
          deferred: 0,
        };
      }
      cashierRecords[element?._id?.userId?.toString()].deferred +=
        element.amount;
    });

    for (const i in cashierRecords) {
      const row: any = {
        username:
          users[cashierRecords[i]?._id?.userId?.toString()]?.name ?? 'N/A',
        cashSales: roundOffNumber(cashierRecords[i].cashSales ?? 0),
        cardSales: roundOffNumber(cashierRecords[i].cardSales ?? 0),
        //totalExpenses: roundOffNumber(cashierRecords[i].expense ?? 0),
        // netCash: roundOffNumber(
        //   (cashierRecords[i].cashSales ?? 0) - (cashierRecords[i].expense ?? 0),
        // ),
        deferred: roundOffNumber(cashierRecords[i].deferred ?? 0),
        totalSales: roundOffNumber(
          (cashierRecords[i].cashSales ?? 0) +
          (cashierRecords[i].cardSales ?? 0) +
          (cashierRecords[i].deferred ?? 0),
        ),
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

  async cashierLogPrint(req, query: CashierLogReportDto) {
    const cashiers = await this.cashierModel
      .find({
        supplierId: req.user.supplierId,
        ...query,
        currentLog: { $ne: null },
      })
      .populate([
        {
          path: 'currentLog',
          populate: [
            {
              path: 'transactions',
              match: { status: PaymentStatus.Success },
              populate: [
                {
                  path: 'orderId',
                  select: {
                    summary: 1,
                    orderNumber: 1,
                    paymentStatus: 1,
                    status: 1,
                  },
                },
              ],
            },
          ],
        },
      ])
      .lean();
    const printData = [];
    for (const i in cashiers) {
      const cashier = {
        name: cashiers[i].name,
        nameAr: cashiers[i].nameAr,
        paidOrders: [],
        cancelledOrders: [],
        unPaidOrders: [],
        deferredOrders: [],
        refundedOrders: [],
        discountedOrders: [],
        expenses: [],
        openningBalance: 0,
        cashSale: 0,
        cardSale: 0,
        totalSale: 0,
        expense: 0,
        refund: 0,
        discount: 0,
        expectedCash: 0,
      };
      cashier.paidOrders = cashiers[i].currentLog.transactions
        .filter((t) => t.orderId.paymentStatus == OrderPaymentStatus.Paid)
        .map((t) => t.orderId);
      console.log(cashier.paidOrders);
      cashier.cancelledOrders = cashiers[i].currentLog.transactions
        .filter((t) => t.orderId.status == OrderStatus.Cancelled)
        .map((t) => t.orderId);
      cashier.unPaidOrders = cashiers[i].currentLog.transactions
        .filter((t) => t.orderId.paymentStatus != OrderPaymentStatus.Paid)
        .map((t) => t.orderId);
      cashier.deferredOrders = cashiers[i].currentLog.transactions
        .filter((t) => t.orderId.paymentStatus == OrderPaymentStatus.Deferred)
        .map((t) => t.orderId);
      cashier.refundedOrders = cashiers[i].currentLog.transactions
        .filter((t) => t.orderId.summary.totalRefunded > 0)
        .map((t) => t.orderId);
      cashier.discountedOrders = cashiers[i].currentLog.transactions
        .filter((t) => t.orderId.summary.discount > 0)
        .map((t) => t.orderId);
      cashier.expenses = cashiers[i].currentLog.expenses;

      cashier.openningBalance = roundOffNumber(
        cashiers[i].currentLog.openingBalance,
      );

      cashier.cashSale = roundOffNumber(
        this.cashierHelperService.foldAmount(
          cashiers[i].currentLog.transactions.filter(
            (s) => s.paymentMethod === PaymentMethod.Cash && !s.isRefund,
          ),
        ),
      );
      cashier.cardSale = roundOffNumber(
        this.cashierHelperService.foldAmount(
          cashiers[i].currentLog.transactions.filter(
            (s) => s.paymentMethod === PaymentMethod.Card && !s.isRefund,
          ),
        ),
      );

      cashier.totalSale = roundOffNumber(
        this.cashierHelperService.foldAmount(
          cashiers[i].currentLog.transactions.filter((s) => !s.isRefund),
        ),
      );

      cashier.expense = roundOffNumber(
        cashiers[i].currentLog.expenses.reduce(
          (prev, acc) => prev + acc.expense,
          0,
        ),
      );

      cashier.refund = roundOffNumber(
        this.cashierHelperService.foldAmount(
          cashiers[i].currentLog.transactions.filter((s) => s.isRefund),
        ),
      );

      cashier.discount = roundOffNumber(
        cashier.discountedOrders.reduce(
          (prev, acc) => prev + acc.summary.discount,
          0,
        ),
      );

      cashier.expectedCash = roundOffNumber(
        cashier.openningBalance +
        cashier.cashSale -
        cashier.refund -
        cashier.expense,
      );
      printData.push(cashier);
    }
    console.log(printData);
    let fileUrls = null;
    if (printData.length > 0) {
      fileUrls = await this.templateService.render(
        'src/template-resolver/templates/cashier.log.v1.html',
        { cashiers: printData, date: new Date() },
        req.user.supplierId + '/cashier-logs/',
        true,
      );
      const printer = await this.printerModel
        .find({
          supplierId: req.user.supplierId,
          type: PrinterType.Cashier,
          isDefault: true,
        })
        .lean();
      if (printer)
        this.socketGateway.emit(req.user.supplierId, SocketEvents.print, {
          printer,
          url: fileUrls.imageUrl,
        });
    }

    return fileUrls;
  }
}
