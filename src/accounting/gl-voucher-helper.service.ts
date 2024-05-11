import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
  forwardRef,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import mongoose, { Model } from 'mongoose';

import { GlVoucher, GlVoucherDocument } from './schemas/gl-voucher.schema';
import { OrderDocument } from 'src/order/schemas/order.schema';
import {
  GlAccountMapping,
  GlAccountMappingDocument,
  GlAssetCodes,
  GlMappingDetail,
  GlMaterialCodes,
  GlVenCodes,
  PurchaseCategoryMapping,
} from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { GlVoucherService } from './gl-voucher.service';
import { CreateGlVoucherItemDto } from './dto/create-gl-voucher-item.dto';
import { OrderPaymentStatus, OrderStatus } from 'src/order/enum/en.enum';
import { GlLineType, GlVoucherType } from './enum/en.enum';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import {
  Transaction,
  TransactionDocument,
} from 'src/transaction/schemas/transactions.schema';
import { ExpenseDocument } from 'src/expense/schemas/expense.schema';
import { PurchaseDocument } from 'src/purchase/schemas/purchase.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { GoodsReceiptDocument } from 'src/goods-receipt/schemas/goods-receipt.schema';
import { InvoiceReceiptDocument } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { WasteEventDocument } from 'src/waste-event/schema/waste-event.schema';
import { InventoryTransferDocument } from 'src/inventory/schemas/inventory-transfer.schema';
import {
  InventoryHistory,
  InventoryHistoryDocument,
} from 'src/inventory/schemas/inventory-history.schema';
import { InventoryAction } from 'src/inventory/enum/en';
import { RecipeDocument } from 'src/recipe/schema/recipe.schema';
import { ProductionEventDocument } from 'src/production-event/schema/production-event.schema';
import { ProfitDetailDocument } from 'src/profit-detail/schema/profit-detail.schema';
import { ManualVendorInvoiceDocument } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualVendorPaymentDocument } from 'src/manual-vendor-payment/schemas/manual-vendor-payment.schema';
import { ManualCustomerPaymentDocument } from '../manual-customer-payment/schemas/manual-customer-payment.schema';
import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceDocument,
} from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import { InventoryCountDocument } from 'src/inventory-count/schema/inventory-count.schema';
import { OrderHelperService } from 'src/order/order-helper.service';
import { PaymentStatus } from 'src/core/Constants/enum';
import { InventoryDocument } from 'src/inventory/schemas/inventory.schema';
import { OpeningBalDocument } from 'src/opening-bal/schemas/opening-bal.schema';
import { EmpTimeSheetDocument } from 'src/employee-mgmt/schemas/emp-hourly-timesheet.schema';
import { PaymentFeesDocument } from 'src/payment-setup/schemas/payment-fees.schema';
import { EmpMonthlySalaryDocument } from 'src/employee-mgmt/schemas/emp-monthly-payroll.schema';
import { AssetRetirementDocument } from 'src/asset-management/asset-aqu/schemas/asset-retirement.schema';
import { AssetAquTransDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu-transaction.schema';
import { AssetAquDepDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu-dep.schema';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { InventoryTransferNewDocument } from 'src/inventory/schemas/inventory-transfer-new.schema';
import { WasteEventNewDocument } from 'src/waste-event/schema/waste-event-new.schema';
import { ProductionEventNewDocument } from 'src/production-event/schema/production-event-new.schema';

@Injectable()
export class GlVoucherHelperService {
  constructor(
    @InjectModel(GlVoucher.name)
    private readonly glVoucherModel: Model<GlVoucherDocument>,
    @InjectModel(GlAccountMapping.name)
    private readonly glAccountMappingModel: Model<GlAccountMappingDocument>,
    @Inject(forwardRef(() => GlVoucherService))
    private readonly glVoucherService: GlVoucherService,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(InventoryHistory.name)
    private readonly inventoryHistoryModel: Model<InventoryHistoryDocument>,
    @Inject(forwardRef(() => OrderHelperService))
    private readonly orderHelperService: OrderHelperService,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @Inject(forwardRef(() => UnitOfMeasureHelperService))
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
  ) { }

  async handleSale(order: OrderDocument) {
    if (order.trasferredToGl) return;
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: order.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${order.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    if (order.paymentStatus == OrderPaymentStatus.Paid) {
      const transactions = await this.transactionModel.find({
        orderId: order._id,
        status: PaymentStatus.Success,
      });
      for (const i in transactions) {
        const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
          mapping,
          transactions[i].paymentMethod,
        );
        items.push({
          glAccountId: paymentMethodAccount?.glAccount?.toString(),
          glLineType: GlLineType.DR,
          amount: roundOffNumber(transactions[i].amount, 3),
          description: '',
          ...paymentMethodAccount,
        });
      }
    } else {
      // if its not paid
      const accountReceivable: GlMappingDetail = this.findGlAccount(
        mapping,
        'accountReceivable',
      );

      items.push({
        glAccountId: accountReceivable?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(order.summary.totalWithTax, 3),
        description: '',
        ...accountReceivable,
      });
    }
    // Revenue = Summary.subTotal
    const revenueAmount = roundOffNumber(order.summary.subTotal, 3);
    // CR --> Revenue Net
    const revenueAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'crRevenue',
    );

    items.push({
      glAccountId: revenueAccount?.glAccount?.toString(),
      glLineType: GlLineType.CR,
      amount: revenueAmount,
      description: '',
      ...revenueAccount,
    });
    // CR --> Shisha Tax
    if (order.summary.taxableFee > 0 && order.isShishaFeeApplicable) {
      const shishaTaxAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'crShishaTax',
      );
      //let shishaFee = roundOffNumber(order.summary.totalFee, 3);
      // order.items.forEach((oi) => {
      //   if (oi.menuItem.feeRate == 100)
      //     shishaFee += roundOffNumber(oi.itemTaxableAmount / 2, 3);
      // });
      items.push({
        glAccountId: shishaTaxAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(order.summary.totalFee, 3),
        description: '',
        ...shishaTaxAccount,
      });
    }
    // CR --> Output tax
    if (order.summary.totalTax > 0) {
      const outputTaxAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'crOutputTax',
      );
      items.push({
        glAccountId: outputTaxAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(order.summary.totalTax, 3),
        description: '',
        ...outputTaxAccount,
      });
    }
    if (!order.isEmployeeMeal) {
      let glVoucher;
      try {
        glVoucher = await this.glVoucherService.create(
          {
            user: {
              userId: order.addedBy,
              supplierId: order.supplierId._id,
            },
          },
          {
            restaurantId: order.restaurantId._id.toString(),
            referenceNumber: order._id.toString(),
            referenceDocNumber: order.orderNumber.toString(),
            type: GlVoucherType.Sales,
            date: new Date(),
            items,
          },
        );
      } catch (err) {
        console.log(`Failed to create gl voucher for sales - ${order._id}`, err);
        console.log({
          restaurantId: order.restaurantId._id.toString(),
          referenceNumber: order._id.toString(),
          type: GlVoucherType.Sales,
          date: new Date(),
          items,
        });
      }
      if (glVoucher) {
        order.glVoucherId = glVoucher._id;
        order.trasferredToGl = true;
        order.transferredAt = new Date();
        order.save();
      }
    }
    console.log(`###################Manage Inventory `, order._id);

    this.orderHelperService.manageInventory(order);
  }
  async handleSalesPayment(order: OrderDocument) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: order.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${order.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    if (order.trasferredToGl) {
      const transactions = await this.transactionModel.find({
        orderId: order._id,
      });
      console.log(transactions);
      for (const i in transactions) {
        const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
          mapping,
          transactions[i].paymentMethod,
        );
        items.push({
          glAccountId: paymentMethodAccount?.glAccount?.toString(),
          glLineType: GlLineType.DR,
          amount: roundOffNumber(transactions[i].amount, 3),
          description: '',
          ...paymentMethodAccount,
        });
      }
      const accountReceivable: GlMappingDetail = this.findGlAccount(
        mapping,
        'accountReceivable',
      );

      items.push({
        glAccountId: accountReceivable?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(order.summary.totalWithTax, 3),
        description: '',
        ...accountReceivable,
      });
      let glVoucher;
      try {
        glVoucher = await this.glVoucherService.create(
          {
            user: {
              userId: order.addedBy,
              supplierId: order.supplierId._id,
            },
          },
          {
            restaurantId: order.restaurantId.toString(),
            referenceNumber: order._id.toString(),
            referenceDocNumber: order.orderNumber.toString(),
            type: GlVoucherType.CustomerPayment,
            date: new Date(),
            items,
          },
        );
      } catch (err) {
        console.log(
          `Failed to create gl voucher for Payment - ${order._id}`,
          err,
        );
        console.log({
          restaurantId: order.restaurantId.toString(),
          referenceNumber: order._id.toString(),
          type: GlVoucherType.CustomerPayment,
          date: new Date(),
          items,
        });
      }
    }
  }

  async handleRefund(transaction: TransactionDocument) {
    if (!transaction.isRefund) {
      return;
    }
    await transaction.populate([
      {
        path: 'orderId',
      },
    ]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: transaction.supplierId,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${transaction.supplierId}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    let revenue = transaction.amount / (1 + transaction.orderId.taxRate / 100);

    const tax = transaction.amount - revenue;
    let shishaTax = 0;
    if (transaction.orderId.feeRate > 0) {
      shishaTax = revenue / (1 + transaction.orderId.feeRate / 100);
      revenue = revenue - shishaTax;
    }

    // DR --> Revenue Net
    if (revenue > 0) {
      const revenueAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'crRevenue',
      );
      items.push({
        glAccountId: revenueAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(revenue, 3),
        description: '',
        ...revenueAccount,
      });
    }

    // DR --> Shisha Tax
    if (transaction.orderId.feeRate == 100) {
      const shishaTaxAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'crShishaTax',
      );
      items.push({
        glAccountId: shishaTaxAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(revenue, 3),
        description: '',
        ...shishaTaxAccount,
      });
    }
    // DR --> Output tax
    if (tax > 0) {
      const outputTaxAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'crOutputTax',
      );
      items.push({
        glAccountId: outputTaxAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(tax, 3),
        description: '',
        ...outputTaxAccount,
      });
    }

    // CR --> Cash
    if (transaction.amount > 0) {
      const cashAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        PaymentMethod.Cash,
      );
      items.push({
        glAccountId: cashAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(transaction.amount, 3),
        description: '',
        ...cashAccount,
      });
    }
    if (items.length == 0) return;
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: transaction.addedBy,
            supplierId: transaction.supplierId,
          },
        },
        {
          restaurantId: transaction.orderId.restaurantId._id,
          referenceNumber: transaction.orderId._id.toString(),
          referenceDocNumber: transaction.orderId?.orderNumber?.toString(),
          type: GlVoucherType.Refund,
          date: new Date(),
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Refund - ${transaction._id}`,
        err,
      );
      console.log({
        restaurantId: transaction.orderId.restaurantId._id,
        referenceNumber: transaction.orderId._id.toString(),
        type: GlVoucherType.CustomerPayment,
        date: new Date(),
        items,
      });
    }
  }

  async handleExpense(expense: ExpenseDocument) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: expense.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${expense.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const drInputTaxAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'drInputTax',
    );
    let grossAmount = 0;
    expense.items.forEach((i) => {
      items.push({
        glAccountId: i.purpose.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(i.net, 3),
        description: '',
      });
      if (i.tax > 0) {
        items.push({
          glAccountId: drInputTaxAccount?.glAccount?.toString(),
          glLineType: GlLineType.DR,
          amount: roundOffNumber(i.tax, 3),
          description: '',
          ...drInputTaxAccount,
        });
      }

      grossAmount += i.grossAmount;
    });
    if (expense.paymentType == 'Other') {
      items.push({
        glAccountId: expense.otherGLAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(grossAmount, 3),
        description: ''
      });
    } else {
      const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        expense.paymentType,
      );
      items.push({
        glAccountId: paymentMethodAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(grossAmount, 3),
        description: '',
        ...paymentMethodAccount,
      });
    }
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: expense.addedBy,
            supplierId: expense.supplierId._id,
          },
        },
        {
          restaurantId: expense.restaurantId.toString(),
          referenceNumber: expense._id.toString(),
          referenceDocNumber: expense.voucherNumber?.toString(),
          type: GlVoucherType.Expense,
          date: new Date(),
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Expense - ${expense._id}`,
        err,
      );
      console.log({
        restaurantId: expense.restaurantId.toString(),
        referenceNumber: expense._id.toString(),
        type: GlVoucherType.Expense,
        date: new Date(),
        items,
      });
    }
    if (glVoucher) {
      expense.glVoucherId = glVoucher._id;
      expense.trasferredToGl = true;
      expense.transferredAt = new Date();
      expense.save();
    }
  }

  async handlePurchase(purchase: PurchaseDocument) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: purchase.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${purchase.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const drInputTaxAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'drInputTax',
    );
    let grossAmount = 0;
    purchase.items.forEach((i) => {
      const categoryAccount: PurchaseCategoryMapping = this.findGlAccount(
        mapping,
        i.category.toString(),
        'purchaseCategory',
      );
      items.push({
        glAccountId: categoryAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(i.net, 3),
        description: '',
        ...categoryAccount,
      });
      if (i.tax > 0) {
        items.push({
          glAccountId: drInputTaxAccount?.glAccount?.toString(),
          glLineType: GlLineType.DR,
          amount: roundOffNumber(i.tax, 3),
          description: '',
          ...drInputTaxAccount,
        });
      }
      grossAmount += i.grossAmount;
    });

    if (purchase.paymentType == 'Other') {
      items.push({
        glAccountId: purchase.otherGLAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(grossAmount, 3),
        description: ''
      });
    } else {
      const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        purchase.paymentType,
      );

      items.push({
        glAccountId: paymentMethodAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(grossAmount, 3),
        description: '',
        ...paymentMethodAccount,
      });
    }


    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: purchase.addedBy,
            supplierId: purchase.supplierId._id,
          },
        },
        {
          restaurantId: purchase.restaurantId.toString(),
          referenceNumber: purchase._id.toString(),
          referenceDocNumber: purchase.voucherNumber?.toString(),
          type: GlVoucherType.Purchase,
          date: new Date(),
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Purchase - ${purchase._id}`,
        err,
      );
      console.log({
        restaurantId: purchase.restaurantId.toString(),
        referenceNumber: purchase._id.toString(),
        type: GlVoucherType.Purchase,
        date: new Date(),
        items,
      });
    }
    if (glVoucher) {
      purchase.glVoucherId = glVoucher._id;
      purchase.trasferredToGl = true;
      purchase.transferredAt = new Date();
      purchase.save();
    }
  }

  async handleGoodsReceipt(goodsReceipt: GoodsReceiptDocument) {
    await goodsReceipt.populate([{ path: 'items.materialId' }]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: goodsReceipt.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${goodsReceipt.supplierId._id}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    goodsReceipt.items.forEach((i) => {
      const glAccountRef: GlMaterialCodes = this.findGlAccount(
        mapping,
        i.materialId?.glMaterialCodeId?.toString(),
        'materialCode',
      );
      if (!items[glAccountRef?.invengtoryGlAccount?.toString()]) {
        items[glAccountRef?.invengtoryGlAccount?.toString()] = {
          glAccountId: glAccountRef?.invengtoryGlAccount,
          glLineType: goodsReceipt.isReturn ? GlLineType.CR : GlLineType.DR,
          amount: 0,
          description: '',
          ...glAccountRef,
        };
      }
      items[glAccountRef?.invengtoryGlAccount?.toString()].amount +=
        roundOffNumber((i.netPrice * i.stock), 2);

      if (!items[glAccountRef?.grirGlAccount?.toString()]) {
        items[glAccountRef?.grirGlAccount?.toString()] = {
          glAccountId: glAccountRef?.grirGlAccount,
          glLineType: goodsReceipt.isReturn ? GlLineType.DR : GlLineType.CR,
          amount: 0,
          description: '',
          ...glAccountRef,
        };
      }
      items[glAccountRef?.grirGlAccount?.toString()].amount += roundOffNumber(
        (i.netPrice * i.stock),
        2,
      );
    });
    items = Object.values(items);
    let glVoucher;

    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: goodsReceipt.addedBy,
            supplierId: goodsReceipt.supplierId._id,
          },
        },
        {
          restaurantId: goodsReceipt.restaurantId.toString(),
          purchaseOrderId: goodsReceipt.purchaseOrderId.toString(),
          referenceNumber: goodsReceipt._id.toString(),
          referenceDocNumber: goodsReceipt?.docNumber,
          type: GlVoucherType.GoodsReceipt,
          date: goodsReceipt?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Goods Receipts - ${goodsReceipt._id}`,
        err,
      );
      // console.log({
      //   restaurantId: goodsReceipt.restaurantId.toString(),
      //   referenceNumber: goodsReceipt._id.toString(),
      //   type: GlVoucherType.GoodsReceipt,
      //   date: new Date(),
      //   items,
      // });
    }
    if (glVoucher) {
      goodsReceipt.glVoucherId = glVoucher._id;
      goodsReceipt.trasferredToGl = true;
      goodsReceipt.transferredAt = new Date();
      goodsReceipt.save();
    }
  }

  async handleInvoiceReceipt(invoiceReceipt: InvoiceReceiptDocument) {
    await invoiceReceipt.populate([
      { path: 'items.materialId' },
      { path: 'purchaseOrderId', populate: [{ path: 'vendorId' }] },
    ]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: invoiceReceipt.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${invoiceReceipt.supplierId._id}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    const glVendorRef: GlVenCodes = this.findGlAccount(
      mapping,
      invoiceReceipt?.purchaseOrderId?.vendorId?.glVendorCodeId?.toString(),
      'glVenCode',
    );
    // const glTaxClearing: GlMappingDetail = this.findGlAccount(
    //   mapping,
    //   'taxClearing',
    // );
    const drInputTax: GlMappingDetail = this.findGlAccount(
      mapping,
      'drInputTax',
    );
    invoiceReceipt.items.forEach((i) => {
      const glAccountRef: GlMaterialCodes = this.findGlAccount(
        mapping,
        i.materialId.glMaterialCodeId?.toString(),
        'materialCode',
      );
      if (!items[glVendorRef?.glAccount?.toString()]) {
        items[glVendorRef?.glAccount?.toString()] = {
          glAccountId: glVendorRef.glAccount,
          glLineType: invoiceReceipt.isReturn ? GlLineType.DR : GlLineType.CR,
          amount: 0,
          description: '',
          ...glVendorRef,
        };
      }
      items[glVendorRef?.glAccount?.toString()].amount += roundOffNumber(
        i.stockValue,
        2,
      );
      if (!items[glAccountRef?.grirGlAccount?.toString()]) {
        items[glAccountRef?.grirGlAccount?.toString()] = {
          glAccountId: glAccountRef?.grirGlAccount,
          glLineType: invoiceReceipt.isReturn ? GlLineType.CR : GlLineType.DR,
          amount: 0,
          description: '',
          ...glAccountRef,
        };
      }

      items[glAccountRef?.grirGlAccount?.toString()].amount += roundOffNumber(
        (i.netPrice * i.stock),
        2,
      );

      if (!items[drInputTax?.glAccount?.toString() + '_DR']) {
        items[drInputTax?.glAccount?.toString() + '_DR'] = {
          glAccountId: drInputTax.glAccount,
          glLineType: invoiceReceipt.isReturn ? GlLineType.CR : GlLineType.DR,
          amount: 0,
          description: '',
          ...drInputTax,
        };
      }

      items[drInputTax?.glAccount?.toString() + '_DR'].amount += roundOffNumber(
        (i.stock * i.tax),
        2,
      );

      // if (!items[glTaxClearing?.glAccount?.toString() + '_CR']) {
      //   items[glTaxClearing?.glAccount?.toString() + '_CR'] = {
      //     glAccountId: glTaxClearing.glAccount,
      //     glLineType: GlLineType.CR,
      //     amount: 0,
      //     description: '',
      //     ...glTaxClearing,
      //   };
      // }
      // items[glTaxClearing?.glAccount?.toString() + '_CR'].amount +=
      //   roundOffNumber(i.stock * i.tax, 3);
    });
    console.log("items", items);
    items = Object.values(items);


    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: invoiceReceipt.addedBy,
            supplierId: invoiceReceipt.supplierId._id,
          },
        },
        {
          restaurantId: invoiceReceipt.restaurantId.toString(),
          purchaseOrderId: invoiceReceipt.purchaseOrderId._id.toString(),
          referenceNumber: invoiceReceipt._id.toString(),
          referenceDocNumber: invoiceReceipt?.docNumber,
          type: GlVoucherType.InvoiceReceipt,
          date: invoiceReceipt?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Invoice Receipts - ${invoiceReceipt._id}`,
        err,
      );
      // console.log({
      //   restaurantId: invoiceReceipt.restaurantId.toString(),
      //   referenceNumber: invoiceReceipt._id.toString(),
      //   type: GlVoucherType.InvoiceReceipt,
      //   date: new Date(),
      //   items,
      // });
    }
    if (glVoucher) {
      invoiceReceipt.glVoucherId = glVoucher._id;
      invoiceReceipt.trasferredToGl = true;
      invoiceReceipt.transferredAt = new Date();
      invoiceReceipt.save();
    }
  }


  async handleWasteEventNew(wasteEvent: WasteEventNewDocument) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: wasteEvent.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${wasteEvent.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];

    for (let i = 0; i < wasteEvent.items.length; i++) {

      const wasteEventGlAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'wasteExpense',
      );
      const inventoryAccountRef: GlMaterialCodes = this.findGlAccount(
        mapping,
        wasteEvent.items[i].materialId.glMaterialCodeId?.toString(),
        'materialCode',
      );

      let amount = wasteEvent.items[i].value;

      // const matAdd = await this.restaurantMaterialModel.findOne({
      //   restaurantId: wasteEvent.restaurantId,
      //   materialId: wasteEvent.items[i].materialId._id
      // }).populate([{
      //   path: 'materialId'
      // }]);

      // if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
      //   const convert =
      //     await this.unitOfMeasureHelperService.getConversionFactor(
      //       matAdd?.materialId?.uomBase?.toString(),
      //       wasteEvent.items[i]?.uom?.toString()
      //     );
      //   amount = wasteEvent.items[i].quantity * convert.conversionFactor * matAdd?.overridePrice;
      // }

      items.push({
        glAccountId: wasteEventGlAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(amount, 3),
        description: '',
        ...wasteEventGlAccount,
      });
      items.push({
        glAccountId: inventoryAccountRef?.invengtoryGlAccount.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(amount, 3),
        description: '',
        ...inventoryAccountRef,
      });
    }

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: wasteEvent.addedBy,
            supplierId: wasteEvent.supplierId._id,
          },
        },
        {
          restaurantId: wasteEvent.restaurantId.toString(),
          referenceNumber: wasteEvent._id?.toString(),
          referenceDocNumber: wasteEvent.docNumber?.toString(),
          type: GlVoucherType.WasteEvent,
          date: wasteEvent?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Waste Event - ${wasteEvent._id}`,
        err,
      );
    }
    if (glVoucher) {
      wasteEvent.glVoucherId = glVoucher._id;
      wasteEvent.trasferredToGl = true;
      wasteEvent.transferredAt = new Date();
      wasteEvent.save();
    }
  }

  async handleWasteEvent(wasteEvent: WasteEventDocument) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: wasteEvent.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${wasteEvent.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const wasteEventGlAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'wasteExpense',
    );
    const inventoryAccountRef: GlMaterialCodes = this.findGlAccount(
      mapping,
      wasteEvent.materialId.glMaterialCodeId?.toString(),
      'materialCode',
    );
    items.push({
      glAccountId: wasteEventGlAccount?.glAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(wasteEvent.value, 3),
      description: '',
      ...wasteEventGlAccount,
    });
    items.push({
      glAccountId: inventoryAccountRef?.invengtoryGlAccount.toString(),
      glLineType: GlLineType.CR,
      amount: roundOffNumber(wasteEvent.value, 3),
      description: '',
      ...inventoryAccountRef,
    });
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: wasteEvent.addedBy,
            supplierId: wasteEvent.supplierId._id,
          },
        },
        {
          restaurantId: wasteEvent.restaurantId.toString(),
          referenceNumber: wasteEvent._id.toString(),
          type: GlVoucherType.WasteEvent,
          date: wasteEvent?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Waste Event - ${wasteEvent._id}`,
        err,
      );
    }
    if (glVoucher) {
      wasteEvent.glVoucherId = glVoucher._id;
      wasteEvent.trasferredToGl = true;
      wasteEvent.transferredAt = new Date();
      wasteEvent.save();
    }
  }

  async handleStockTransferNew(inventoryTransfer: InventoryTransferNewDocument) {
    await inventoryTransfer.populate([{ path: 'items.materialId' }]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: inventoryTransfer.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${inventoryTransfer.supplierId._id}`,
      );
      return;
    }
    const inventoryHistory = await this.inventoryHistoryModel.find({
      dataId: inventoryTransfer._id,
      action: InventoryAction.SentWithTransfer,
      restaurantId: inventoryTransfer.sourceRestaurantId,
    });
    let items1: CreateGlVoucherItemDto[] = [];

    // Source Restaurant Calculation

    for (let i = 0; i < inventoryTransfer.items.length; i++) {
      console.log("inventoryTransfer.items[i].materialId", inventoryTransfer.items[i]);
      const glMatCodeAccount: GlMaterialCodes = this.findGlAccount(
        mapping,
        inventoryTransfer.items[i].materialId.glMaterialCodeId?.toString(),
        'materialCode',
      );
      const sfInterCompanyAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'sfInterCompany',
      );
      const existInvHistory = inventoryHistory.find((f: any) => f.materialId?.toString() ==
        inventoryTransfer.items[i].materialId._id?.toString());

      let amount = existInvHistory?.stockValue;
      // check material addition if they allow override price
      const matAdd = await this.restaurantMaterialModel.findOne({
        restaurantId: inventoryTransfer.sourceRestaurantId,
        materialId: inventoryTransfer.items[i].materialId
      }).populate([{
        path: 'materialId'
      }]);

      if (matAdd && matAdd != null && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            matAdd?.materialId?.uomBase?.toString(),
            inventoryTransfer.items[i]?.uom?.toString()
          );

        amount = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor * inventoryTransfer.items[i].stock;
      }

      items1.push({
        glAccountId: glMatCodeAccount.invengtoryGlAccount.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(amount, 3),
        description: ''
      });
      items1.push({
        glAccountId: sfInterCompanyAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(amount, 3),
        description: '',
        restaurantId: inventoryTransfer.targetRestaurantId?.toString()
      });

      inventoryTransfer.items[i].value = roundOffNumber(amount, 3);
      await inventoryTransfer.save();
    }
    console.log("items1", items1);
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: inventoryTransfer.addedBy,
            supplierId: inventoryTransfer.supplierId._id,
          },
        },
        {
          restaurantId: inventoryTransfer.sourceRestaurantId.toString(),
          referenceNumber: inventoryTransfer._id.toString(),
          referenceDocNumber: inventoryTransfer?.docNumber?.toString(),
          type: GlVoucherType.StockTransfer,
          date: inventoryTransfer?.date,
          items: items1,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Stock Transfer - ${inventoryTransfer._id}`,
        err,
      );
    }
    if (glVoucher) {
      inventoryTransfer.glVoucherId = glVoucher._id;
      inventoryTransfer.trasferredToGl = true;
      inventoryTransfer.transferredAt = new Date();
      await inventoryTransfer.save();
    }

    // Target Restaurant GL Voucher

    items1 = [];
    const inventoryHistoryR = await this.inventoryHistoryModel.find({
      dataId: inventoryTransfer._id,
      action: InventoryAction.ReceivedWithTransfer,
      restaurantId: inventoryTransfer.targetRestaurantId,
    });

    for (let i = 0; i < inventoryTransfer.items.length; i++) {
      const glMatCodeAccount: GlMaterialCodes = this.findGlAccount(
        mapping,
        inventoryTransfer.items[i].materialId.glMaterialCodeId?.toString(),
        'materialCode',
      );
      const sfInterCompanyAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        'sfInterCompany',
      );

      const existInv = inventoryHistoryR.find((f: any) => f.materialId?.toString() ==
        inventoryTransfer.items[i].materialId._id?.toString());

      let amount = existInv?.stockValue;

      // check material addition if they allow override price
      const matAdd = await this.restaurantMaterialModel.findOne({
        restaurantId: inventoryTransfer.sourceRestaurantId,
        materialId: inventoryTransfer.items[i].materialId
      }).populate([{
        path: 'materialId'
      }]);

      if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            matAdd?.materialId?.uomBase?.toString(),
            inventoryTransfer.items[i]?.uom?.toString()
          );
        amount = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor *
          inventoryTransfer.items[i].stock;
      }
      items1.push({
        glAccountId: glMatCodeAccount.invengtoryGlAccount.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(amount, 3),
        description: ''
      });

      items1.push({
        glAccountId: sfInterCompanyAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(amount, 3),
        description: '',
        restaurantId: inventoryTransfer.sourceRestaurantId?.toString()
      });
    }
    console.log("items1 target", items1);
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: inventoryTransfer.addedBy,
            supplierId: inventoryTransfer.supplierId._id,
          },
        },
        {
          restaurantId:
            inventoryTransfer.targetRestaurantId.toString(),
          referenceNumber: inventoryTransfer._id.toString(),
          referenceDocNumber: inventoryTransfer?.docNumber,
          type: GlVoucherType.StockTransfer,
          date: inventoryTransfer?.date,
          items: items1,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Stock Transfer - ${inventoryTransfer._id}`,
        err,
      );

    }
  }

  async handleStockTransfer(inventoryTransfer: InventoryTransferDocument) {
    await inventoryTransfer.populate([{ path: 'materialId' }]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: inventoryTransfer.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${inventoryTransfer.supplierId._id}`,
      );
      return;
    }
    const inventoryHistory = await this.inventoryHistoryModel.findOne({
      dataId: inventoryTransfer._id,
      action: InventoryAction.SentWithTransfer,
      restaurantId: inventoryTransfer.sourceRestaurantId,
    });
    let items1: CreateGlVoucherItemDto[] = [];

    const glMatCodeAccount: GlMaterialCodes = this.findGlAccount(
      mapping,
      inventoryTransfer.materialId.glMaterialCodeId?.toString(),
      'materialCode',
    );
    const sfInterCompanyAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'sfInterCompany',
    );
    items1.push({
      glAccountId: glMatCodeAccount.invengtoryGlAccount.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(inventoryHistory?.stockValue, 3),
      description: '',
      ...glMatCodeAccount,
      // partnerRestaurantId:
      //   inventoryTransfer.target[0].targetRestaurantId.toString(),
    });
    items1.push({
      glAccountId: sfInterCompanyAccount?.glAccount?.toString(),
      glLineType: GlLineType.CR,
      amount: roundOffNumber(inventoryHistory?.stockValue, 3),
      description: '',
      partnerRestaurantId:
        inventoryTransfer.target[0].targetRestaurantId.toString(),
      ...sfInterCompanyAccount,
    });

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: inventoryTransfer.addedBy,
            supplierId: inventoryTransfer.supplierId._id,
          },
        },
        {
          restaurantId: inventoryTransfer.sourceRestaurantId.toString(),
          referenceNumber: inventoryTransfer._id.toString(),
          referenceDocNumber: inventoryTransfer?.docNumber,
          type: GlVoucherType.StockTransfer,
          date: inventoryTransfer?.date,
          items: items1,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Stock Transfer - ${inventoryTransfer._id}`,
        err,
      );
    }
    if (glVoucher) {
      inventoryTransfer.glVoucherId = glVoucher._id;
      inventoryTransfer.trasferredToGl = true;
      inventoryTransfer.transferredAt = new Date();
      inventoryTransfer.save();
    }

    for (const i in inventoryTransfer.target) {
      items1 = [];
      const inventoryHistory = await this.inventoryHistoryModel.findOne({
        dataId: inventoryTransfer._id,
        action: InventoryAction.ReceivedWithTransfer,
        restaurantId: inventoryTransfer.target[i].targetRestaurantId,
      });

      let amount = inventoryHistory?.stockValue;
      // check material addition if they allow override price
      const matAdd = await this.restaurantMaterialModel.findOne({
        restaurantId: inventoryTransfer.target[i].targetRestaurantId,
        materialId: inventoryTransfer.materialId
      }).populate([{
        path: 'materialId'
      }]);

      console.log("Stock Transfer matadd", matAdd);
      console.log("Stock Transfer inventoryTransfer", inventoryTransfer);

      if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            matAdd?.materialId?.uomBase?.toString(),
            inventoryTransfer?.uom?.toString()
          );
        console.log("Stock Transfer convert", convert);
        amount = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor * inventoryTransfer.stock;
      }

      items1.push({
        glAccountId: glMatCodeAccount.invengtoryGlAccount.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(amount, 3),
        description: '',
        ...glMatCodeAccount,
        // partnerRestaurantId: inventoryTransfer.sourceRestaurantId.toString(),
      });
      items1.push({
        glAccountId: sfInterCompanyAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(amount, 3),
        description: '',
        partnerRestaurantId: inventoryTransfer.sourceRestaurantId.toString(),
        ...sfInterCompanyAccount,
      });

      let glVoucher;
      try {
        glVoucher = await this.glVoucherService.create(
          {
            user: {
              userId: inventoryTransfer.addedBy,
              supplierId: inventoryTransfer.supplierId._id,
            },
          },
          {
            restaurantId:
              inventoryTransfer.target[i].targetRestaurantId.toString(),
            referenceNumber: inventoryTransfer._id.toString(),
            referenceDocNumber: inventoryTransfer?.docNumber,
            type: GlVoucherType.StockTransfer,
            date: inventoryTransfer?.date,
            items: items1,
          },
        );
      } catch (err) {
        console.log(
          `Failed to create gl voucher for Stock Transfer - ${inventoryTransfer._id}`,
          err,
        );

      }
    }
  }


  async handleRecipeProductionNew(productionEvent: ProductionEventNewDocument, preparedData: any) {

    //same as Goods Issue
    await productionEvent.populate([
      {
        path: 'items.materialId',
      }
    ]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: productionEvent.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${productionEvent.supplierId._id}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];

    for (let i = 0; i < productionEvent.items.length; i++) {

      // console.log("productionEvent.items", JSON.stringify(productionEvent.items));

      // console.log("preparedData", JSON.stringify(preparedData));
      // console.log("preparedData2 ", preparedData);
      const mainMaterialGlAccountRef: GlMaterialCodes = this.findGlAccount(
        mapping,
        productionEvent.items[i].materialId?.glMaterialCodeId?.toString(),
        'materialCode',
      );

      items.push({
        amount: roundOffNumber(productionEvent.items[i].cost, 3),
        glAccountId: mainMaterialGlAccountRef?.invengtoryGlAccount?.toString(),
        glLineType: GlLineType.DR,
      });

      const itemData = preparedData.find((f: any) => f.material?._id?.toString() ==
        productionEvent.items[i].materialId?._id?.toString())?.itemData;
      for (let j = 0; j < itemData?.items?.length; j++) {
        const ele = itemData?.items[j];
        const subMaterialId: GlMaterialCodes = this.findGlAccount(
          mapping,
          ele.materialId?.glMaterialCodeId?.toString(),
          'materialCode',
        );
        if (subMaterialId) {
          items.push({
            amount: roundOffNumber(ele.stockValue, 3),
            glAccountId: subMaterialId?.invengtoryGlAccount?.toString(),
            glLineType: GlLineType.CR,
          });
        }
      }
    }

    console.log("items", items);

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: productionEvent.addedBy,
            supplierId: productionEvent.supplierId._id,
          },
        },
        {
          restaurantId: productionEvent.restaurantId.toString(),
          referenceNumber: productionEvent._id.toString(),
          referenceDocNumber: productionEvent?.docNumber,
          type: GlVoucherType.RecipeProduction,
          date: productionEvent?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Recipe Production - ${productionEvent._id}`,
        err,
      );
    }
    if (glVoucher) {
      productionEvent.glVoucherId = glVoucher._id;
      productionEvent.trasferredToGl = true;
      productionEvent.transferredAt = new Date();
      await productionEvent.save();
    }
  }


  async handleRecipeProduction(productionEvent: ProductionEventDocument) {
    await productionEvent.populate([
      {
        path: 'materialId',
      },
      {
        path: 'items.materialId',
      },
    ]);

    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: productionEvent.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${productionEvent.supplierId._id}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    const mainMaterialGlAccountRef: GlMaterialCodes = this.findGlAccount(
      mapping,
      productionEvent.materialId?.glMaterialCodeId?.toString(),
      'materialCode',
    );
    items.push({
      glAccountId: mainMaterialGlAccountRef?.invengtoryGlAccount.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(productionEvent.totalCost, 3),
      description: '',
      ...mainMaterialGlAccountRef,
    });
    productionEvent.items.forEach((i) => {
      const glAccountRef: GlMaterialCodes = this.findGlAccount(
        mapping,
        i.materialId.glMaterialCodeId?.toString(),
        'materialCode',
      );
      if (!items[glAccountRef?.invengtoryGlAccount.toString()]) {
        items[glAccountRef?.invengtoryGlAccount.toString()] = {
          glAccountId: glAccountRef?.invengtoryGlAccount,
          glLineType: GlLineType.CR,
          amount: 0,
          description: '',
          ...glAccountRef,
        };
      }
      items[glAccountRef?.invengtoryGlAccount.toString()].amount +=
        roundOffNumber(i.stockValue, 3);
    });


    // //Override price if material addition have exists
    // const matAdd = await this.restaurantMaterialModel.findOne({
    //   restaurantId: productionEvent.restaurantId,
    //   materialId: productionEvent.materialId
    // });

    // if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
    //   const convert =
    //   await this.unitOfMeasureHelperService.getConversionFactor(
    //     matAdd?.materialId?.uomBase?.toString(),
    //     inventoryTransfer?.uom?.toString()
    //   );
    //   productionEvent.totalCost = matAdd?.overridePrice;
    // }
    items = Object.values(items);
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: productionEvent.addedBy,
            supplierId: productionEvent.supplierId._id,
          },
        },
        {
          restaurantId: productionEvent.restaurantId.toString(),
          referenceNumber: productionEvent._id.toString(),
          referenceDocNumber: productionEvent?.docNumber,
          type: GlVoucherType.RecipeProduction,
          date: productionEvent?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Recipe Production - ${productionEvent._id}`,
        err,
      );
    }
    if (glVoucher) {
      productionEvent.glVoucherId = glVoucher._id;
      productionEvent.trasferredToGl = true;
      productionEvent.transferredAt = new Date();
      productionEvent.save();
    }
  }

  async handleInventoryCount(inventoryCount: InventoryCountDocument) {
    await inventoryCount.populate([
      {
        path: 'items.materialId',
      },
    ]);

    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: inventoryCount.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${inventoryCount.supplierId._id}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    console.log("items start...", items);
    const gainAndLossAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'gainAndLoss',
    );
    const consumptionGlAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'consumptionGlAccount',
    );
    let GLAccVal = [];
    let totalAmount = 0;
    let totalConsumptionAmount = 0;
    let gainLossDR = true;
    inventoryCount.items.forEach((i) => {
      const mainMaterialGlAccountRef: GlMaterialCodes = this.findGlAccount(
        mapping,
        i.materialId?.glMaterialCodeId?.toString(),
        'materialCode',
      );
      const glAccount = mainMaterialGlAccountRef?.invengtoryGlAccount?.toString();
      if (glAccount) {
        if (roundOffNumber(i.countValue) > roundOffNumber(i.onHandCountValue)) {
          GLAccVal.push({
            glAccountId: glAccount,
            amount: roundOffNumber(i.differentialCountValue, 3)
          });
          if (i.materialId?.isConsumption) {
            totalConsumptionAmount += i.differentialCountValue;
          } else {
            totalAmount += i.differentialCountValue;
          }
        }
        else if (roundOffNumber(i.countValue) < roundOffNumber(i.onHandCountValue)) {
          GLAccVal.push({
            glAccountId: glAccount,
            amount: roundOffNumber(i.differentialCountValue * -1, 3)
          });
          if (i.materialId?.isConsumption) {
            totalConsumptionAmount += (i.differentialCountValue * -1);
          } else {
            totalAmount += (i.differentialCountValue * -1);
          }
        }
      }
    });
    if (totalAmount > 0) {
      gainLossDR = false;
    }


    // Summarize/Group Inventory GL & Amount
    var result = [];
    GLAccVal.reduce(function (res, value) {
      if (!res[value.glAccountId]) {
        res[value.glAccountId] = { glAccountId: value.glAccountId, amount: 0 };
        result.push(res[value.glAccountId])
      }
      res[value.glAccountId].amount += value.amount;
      return res;
    }, {});


    for (let j = 0; j < result.length; j++) {
      const el = result[j];
      items.push({
        glAccountId: el.glAccountId,
        amount: Math.abs(el.amount),
        glLineType: el.amount > 0 ? GlLineType.DR : GlLineType.CR,
        description: ''
      });
    }

    //add gain and loss line item
    items.push({
      glAccountId: gainAndLossAccount?.glAccount?.toString(),
      glLineType: gainLossDR ? GlLineType.DR : GlLineType.CR,
      amount: Math.abs(totalAmount),
      description: ''
    });

    console.log("totalConsumptionAmount", totalConsumptionAmount);
    console.log("consumptionGlAccount", consumptionGlAccount);

    if (totalConsumptionAmount != 0 && consumptionGlAccount &&
      consumptionGlAccount?.glAccount) {
      items.push({
        glAccountId: consumptionGlAccount?.glAccount?.toString(),
        glLineType: totalConsumptionAmount > 0 ? GlLineType.CR : GlLineType.DR,
        amount: Math.abs(totalConsumptionAmount),
        description: ''
      });
    }

    items = Object.values(items);

    console.log("items", items);

    if (items.length == 0) {
      console.log(`No changes in  Inventory Count - ${inventoryCount._id}`);
      return;
    }

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: inventoryCount.addedBy,
            supplierId: inventoryCount.supplierId._id,
          },
        },
        {
          restaurantId: inventoryCount.restaurantId.toString(),
          referenceNumber: inventoryCount._id.toString(),
          referenceDocNumber: inventoryCount?.docNumber,
          type: GlVoucherType.InventoryCount,
          date: inventoryCount?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Inventory Count - ${inventoryCount._id}`,
        err,
      );
    }
    if (glVoucher) {
      inventoryCount.glVoucherId = glVoucher._id;
      inventoryCount.trasferredToGl = true;
      inventoryCount.transferredAt = new Date();
      inventoryCount.save();
    }
  }

  async handleSalesGoods(
    profitDetail: ProfitDetailDocument,
    preparedData: any,
    isEmployeeMeal: boolean = false
  ) {

    await profitDetail.populate([
      {
        path: 'materialId',
      },
    ]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: profitDetail.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${profitDetail.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const mainMaterialGlAccountRef: GlMaterialCodes = this.findGlAccount(
      mapping,
      profitDetail.materialId?.glMaterialCodeId?.toString(),
      'materialCode',
    );
    const cogsAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'cogsAccount',
    );
    const employeeExpenseAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'employeeExpense',
    );
    items.push({
      glAccountId: mainMaterialGlAccountRef?.invengtoryGlAccount.toString(),
      glLineType: GlLineType.CR,
      amount: roundOffNumber(profitDetail.totalCost, 3),
      description: '',
      ...mainMaterialGlAccountRef,
    });
    items.push({
      glAccountId: isEmployeeMeal ? employeeExpenseAccount?.glAccount?.toString() :
        cogsAccount?.glAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(profitDetail.totalCost, 3),
      description: '',
      ...cogsAccount,
    });

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: null,
            supplierId: profitDetail.supplierId._id,
          },
        },
        {
          restaurantId: profitDetail.restaurantId.toString(),
          referenceNumber: profitDetail.orderId?._id.toString(),
          referenceDocNumber: profitDetail.orderId?.orderNumber?.toString(),
          type: GlVoucherType.SalesGoodsIssue,
          date: new Date(),
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for goods sales - ${profitDetail.orderId}`,
        err,
      );
    }


    if (preparedData && preparedData?.items?.length > 0) {
      let rawItems: CreateGlVoucherItemDto[] = [];
      preparedData.items.forEach((i) => {
        const materialGlAccountRef: GlMaterialCodes = this.findGlAccount(
          mapping,
          i.materialId?.glMaterialCodeId?.toString(),
          'materialCode',
        );
        if (
          !rawItems[
          mainMaterialGlAccountRef?.invengtoryGlAccount?.toString() + '_DR'
          ]
        ) {
          rawItems[
            mainMaterialGlAccountRef?.invengtoryGlAccount?.toString() + '_DR'
          ] = {
            glAccountId: mainMaterialGlAccountRef?.invengtoryGlAccount,
            glLineType: GlLineType.DR,
            amount: 0,
            description: '',
            ...mainMaterialGlAccountRef,
          };
        }
        rawItems[
          mainMaterialGlAccountRef?.invengtoryGlAccount?.toString() + '_DR'
        ].amount += roundOffNumber(i.stockValue, 3);

        if (
          !rawItems[
          materialGlAccountRef?.invengtoryGlAccount?.toString() + '_CR'
          ]
        ) {
          rawItems[
            materialGlAccountRef?.invengtoryGlAccount?.toString() + '_CR'
          ] = {
            glAccountId: materialGlAccountRef?.invengtoryGlAccount,
            glLineType: GlLineType.CR,
            amount: 0,
            description: '',
            ...materialGlAccountRef,
          };
        }
        rawItems[
          materialGlAccountRef?.invengtoryGlAccount?.toString() + '_CR'
        ].amount += roundOffNumber(i.stockValue, 3);
      });

      rawItems = Object.values(rawItems);
      try {
        glVoucher = await this.glVoucherService.create(
          {
            user: {
              userId: null,
              supplierId: profitDetail.supplierId._id,
            },
          },
          {
            restaurantId: profitDetail.restaurantId.toString(),
            referenceNumber: profitDetail.orderId?._id.toString(),
            referenceDocNumber: profitDetail.orderId?.orderNumber?.toString(),
            type: GlVoucherType.RecipeSalesGoodsIssue,
            date: new Date(),
            items: rawItems,
          },
        );
      } catch (err) {
        console.log(
          `Failed to create gl voucher for recipe goods sales - ${profitDetail.orderId}`,
          err,
        );
      }
    }
  }

  async handleManualVendorInvoice(
    manualVendorInvoice: ManualVendorInvoiceDocument,
  ) {
    await manualVendorInvoice.populate([
      {
        path: 'vendorId',
      },
    ]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: manualVendorInvoice.supplierId,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${manualVendorInvoice.supplierId}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    const glVendorRef: GlVenCodes = this.findGlAccount(
      mapping,
      manualVendorInvoice?.vendorId?.glVendorCodeId?.toString(),
      'glVenCode',
    );
    const inputTax: GlMappingDetail = this.findGlAccount(mapping, 'drInputTax');
    let total = 0;
    manualVendorInvoice.items.forEach((i) => {
      if (!items[i.expense.toString()]) {
        items[i.expense.toString()] = {
          glAccountId: i.expense.toString(),
          glLineType: manualVendorInvoice.isReturn ? GlLineType.CR : GlLineType.DR,
          amount: 0,
          description: '',
          // costCenter: '',
          // segment: '',
          // purpose: '',
        };
      }
      items[i.expense.toString()].amount += (roundOffNumber(i.amount, 3) - roundOffNumber(i.tax, 3));
      if (!items[inputTax?.glAccount?.toString()]) {
        items[inputTax?.glAccount?.toString()] = {
          glAccountId: inputTax?.glAccount?.toString(),
          glLineType: manualVendorInvoice.isReturn ? GlLineType.CR : GlLineType.DR,
          amount: 0,
          description: '',
          ...inputTax,
        };
      }
      items[inputTax?.glAccount?.toString()].amount += roundOffNumber(i.tax, 3);

      total += i.amount;
    });

    items.push({
      glAccountId: glVendorRef?.glAccount?.toString(),
      glLineType: manualVendorInvoice.isReturn ? GlLineType.DR : GlLineType.CR,
      amount: roundOffNumber(total, 3),
      description: '',
      ...glVendorRef,
    });

    items = Object.values(items);
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: manualVendorInvoice.addedBy,
            supplierId: manualVendorInvoice.supplierId,
          },
        },
        {
          restaurantId: manualVendorInvoice.restaurantId.toString(),
          referenceNumber: manualVendorInvoice._id.toString(),
          referenceDocNumber: manualVendorInvoice.docNumber?.toString(),
          type: GlVoucherType.ManualVendorInvoice,
          date: manualVendorInvoice?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Manual Vendor Invoice - ${manualVendorInvoice._id}`,
        err,
      );
    }
    if (glVoucher) {
      manualVendorInvoice.glVoucherId = glVoucher._id;
      manualVendorInvoice.trasferredToGl = true;
      manualVendorInvoice.transferredAt = new Date();
      manualVendorInvoice.save();
    }
  }

  async handleManualVendorPayment(
    manualVendorPayment: ManualVendorPaymentDocument,
  ) {
    await manualVendorPayment.populate([
      {
        path: 'vendorId',
      },
    ]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: manualVendorPayment.supplierId,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${manualVendorPayment.supplierId}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const glVendorRef: GlVenCodes = this.findGlAccount(
      mapping,
      manualVendorPayment?.vendorId?.glVendorCodeId?.toString(),
      'glVenCode',
    );

    items.push({
      glAccountId: glVendorRef?.glAccount?.toString(),
      glLineType: manualVendorPayment.isReturn ? GlLineType.CR : GlLineType.DR,
      amount: roundOffNumber(manualVendorPayment.amount, 3),
      description: '',
      ...glVendorRef,
    });

    if (manualVendorPayment.paymentType == 'Other') {
      items.push({
        glAccountId: manualVendorPayment.otherGLAccount?.toString(),
        glLineType: manualVendorPayment.isReturn ? GlLineType.DR : GlLineType.CR,
        amount: roundOffNumber(manualVendorPayment.amount, 3),
        description: ''
      });
    } else {
      const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        manualVendorPayment.paymentType,
      );
      items.push({
        glAccountId: paymentMethodAccount?.glAccount?.toString(),
        glLineType: manualVendorPayment.isReturn ? GlLineType.DR : GlLineType.CR,
        amount: roundOffNumber(manualVendorPayment.amount, 3),
        description: '',
        ...paymentMethodAccount,
      });
    }

    // items.push({
    //   glAccountId: manualVendorPayment.payFrom.toString(),
    //   glLineType: manualVendorPayment.isReturn ? GlLineType.DR : GlLineType.CR,
    //   amount: roundOffNumber(manualVendorPayment.amount, 3),
    //   description: '',
    // });

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: manualVendorPayment.addedBy,
            supplierId: manualVendorPayment.supplierId,
          },
        },
        {
          restaurantId: manualVendorPayment.restaurantId.toString(),
          referenceNumber: manualVendorPayment._id.toString(),
          referenceDocNumber: manualVendorPayment.docNumber?.toString(),
          type: GlVoucherType.ManualVendorPayment,
          date: manualVendorPayment?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Manual Vendor Payment - ${manualVendorPayment._id}`,
        err,
      );

    }
    if (glVoucher) {
      manualVendorPayment.glVoucherId = glVoucher._id;
      manualVendorPayment.trasferredToGl = true;
      manualVendorPayment.transferredAt = new Date();
      manualVendorPayment.save();
    }
  }

  async handleManualCustomerInvoice(
    manualCustomerInvoice: ManualCustomerInvoiceDocument,
  ) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: manualCustomerInvoice.supplierId,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${manualCustomerInvoice.supplierId}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    const customerAccountReceivables: GlMappingDetail = this.findGlAccount(
      mapping,
      'customerAccountReceivables',
    );
    const ouputTax: GlMappingDetail = this.findGlAccount(
      mapping,
      'crOutputTax',
    );
    let total = 0;

    console.log("manualCustomerInvoice.items", manualCustomerInvoice.items);

    let tempItem = [];
    manualCustomerInvoice.items.forEach((i) => {

      tempItem.push({
        glAccountId: i.expense.toString(),
        glLineType: GlLineType.CR,
        description: '',
        amount: roundOffNumber(i.net, 3)
      });

      tempItem.push({
        glAccountId: ouputTax?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        description: '',
        amount: roundOffNumber(i.tax, 3)
      });

      // i.expense means Revenue (selected from frontend)
      // if (!items[i.expense.toString()]) {
      //   items[i.expense.toString()] = {
      //     glAccountId: i.expense.toString(),
      //     glLineType: GlLineType.CR,
      //     amount: 0,
      //     description: '',
      //   };
      // }
      // items[i.expense.toString()].amount += roundOffNumber(i.net, 3);

      // if (!items[ouputTax?.glAccount?.toString()]) {
      //   items[ouputTax.toString()] = {
      //     glAccountId: ouputTax?.glAccount?.toString(),
      //     glLineType: GlLineType.CR,
      //     amount: 0,
      //     description: '',
      //     ...ouputTax,
      //   };
      // }
      // items[ouputTax.toString()].amount += roundOffNumber(i.tax, 3);

      total += i.amount;
    });


    const groupedTempItem = tempItem.reduce((result, item) => {
      const key = `${item.glAccountId}_${item.glLineType}`;
      if (!result[key]) {
        result[key] = { ...item, amount: 0 };
      }
      result[key].amount += item.amount;
      return result;
    }, {} as Record<string, any>);

    // Converting the grouped object back to an array
    const groupedArray: any = Object.values(groupedTempItem);

    items = groupedArray.map(elx => ({
      glAccountId: elx.glAccountId,
      glLineType: elx.glLineType,
      amount: elx.amount,
      description: ''
    }));

    items.push({
      glAccountId: customerAccountReceivables?.glAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(total, 3),
      description: '',
      ...customerAccountReceivables,
    });

    // items = Object.values(items);

    console.log("items", items);


    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: manualCustomerInvoice.addedBy,
            supplierId: manualCustomerInvoice.supplierId,
          },
        },
        {
          restaurantId: manualCustomerInvoice.restaurantId.toString(),
          referenceNumber: manualCustomerInvoice._id.toString(),
          referenceDocNumber: manualCustomerInvoice.docNumber?.toString(),
          type: GlVoucherType.ManualCustomerInvoice,
          date: manualCustomerInvoice?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Manual Customer Invoice - ${manualCustomerInvoice._id}`,
        err,
      );

    }
    if (glVoucher) {
      manualCustomerInvoice.glVoucherId = glVoucher._id;
      manualCustomerInvoice.trasferredToGl = true;
      manualCustomerInvoice.transferredAt = new Date();
      manualCustomerInvoice.save();
    }
  }

  async handleManualCustomerPayment(
    manualCustomerPayment: ManualCustomerPaymentDocument,
  ) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: manualCustomerPayment.supplierId,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${manualCustomerPayment.supplierId}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const customerAccountReceivables: GlMappingDetail = this.findGlAccount(
      mapping,
      'customerAccountReceivables',
    );
    items.push({
      glAccountId: customerAccountReceivables?.glAccount?.toString(),
      glLineType: GlLineType.CR,
      amount: roundOffNumber(manualCustomerPayment.amount, 3),
      description: '',
      ...customerAccountReceivables,
    });


    if (manualCustomerPayment.paymentType == 'Other') {
      items.push({
        glAccountId: manualCustomerPayment.otherGLAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(manualCustomerPayment.amount, 3),
        description: ''
      });
    } else {
      const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        manualCustomerPayment.paymentType,
      );
      items.push({
        glAccountId: paymentMethodAccount?.glAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(manualCustomerPayment.amount, 3),
        description: '',
        ...paymentMethodAccount,
      });

      manualCustomerPayment.otherGLAccount = paymentMethodAccount?.glAccount?.toString()
    }

    // items.push({
    //   glAccountId: manualCustomerPayment.payFrom.toString(),
    //   glLineType: GlLineType.DR,
    //   amount: roundOffNumber(manualCustomerPayment.amount, 3),
    //   description: '',
    // });

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: manualCustomerPayment.addedBy,
            supplierId: manualCustomerPayment.supplierId,
          },
        },
        {
          restaurantId: manualCustomerPayment.restaurantId.toString(),
          referenceNumber: manualCustomerPayment._id.toString(),
          referenceDocNumber: manualCustomerPayment.docNumber?.toString(),
          type: GlVoucherType.ManualCustomerPayment,
          date: manualCustomerPayment?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Manual Customer Payment - ${manualCustomerPayment._id}`,
        err,
      );
    }
    console.log("manualCustomerPayment.otherGLAccount", manualCustomerPayment.otherGLAccount);
    if (glVoucher) {
      manualCustomerPayment.glVoucherId = glVoucher._id;
      manualCustomerPayment.trasferredToGl = true;
      manualCustomerPayment.transferredAt = new Date();
      await manualCustomerPayment.save();
    }
  };

  async handlePriceChange(
    inventory: InventoryDocument,
    lastAverageSalePrice: number,
    currentPrice: number,
  ) {
    await inventory.populate([{ path: 'materialId' }, { path: 'supplierId' }]);
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: inventory.supplierId._id,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${inventory.supplierId._id}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];
    const avgPriceChange: GlMappingDetail = this.findGlAccount(
      mapping,
      'avgPriceChange',
    );

    const inventoryAccountRef: GlMaterialCodes = this.findGlAccount(
      mapping,
      inventory.materialId.glMaterialCodeId?.toString(),
      'materialCode',
    );


    let amount = Math.abs((lastAverageSalePrice - currentPrice) * inventory.stock);

    if (roundOffNumber(currentPrice) > roundOffNumber(lastAverageSalePrice)) {
      items.push({
        glAccountId: inventoryAccountRef?.invengtoryGlAccount.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(amount, 3),
        description: ''
      });

      items.push({
        glAccountId: avgPriceChange?.glAccount.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(amount, 3),
        description: ''
      });


    } else if (roundOffNumber(currentPrice) < roundOffNumber(lastAverageSalePrice)) {
      console.log("currentPrice Lower", currentPrice)
      items.push({
        glAccountId: avgPriceChange?.glAccount.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(amount, 3),
        description: ''
      });
      items.push({
        glAccountId: inventoryAccountRef?.invengtoryGlAccount.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(amount, 3),
        description: ''
      });
    }


    if (items.length == 0) {
      console.log(`No changes in  Inventory - ${inventory._id}`);
      return;
    }
    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: inventory.addedBy,
            supplierId: inventory.supplierId._id,
          },
        },
        {
          restaurantId: inventory.restaurantId.toString(),
          referenceNumber: inventory._id.toString(),
          type: GlVoucherType.PriceChange,
          date: new Date(),
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Inventory Count - ${inventory._id}`,
        err,
      );
    }

    if (glVoucher) {
      inventory.glVoucherId = glVoucher._id;
      inventory.trasferredToGl = true;
      inventory.transferredAt = new Date();
      await inventory.save();
    }
  }

  async handleOpeningBalance(
    openingBal: OpeningBalDocument,
    glItems: any
  ) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: openingBal.supplierId,
    });
    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${openingBal.supplierId}`,
      );
      return;
    }
    const items: CreateGlVoucherItemDto[] = [];

    for (let i = 0; i < glItems.length; i++) {
      const el = glItems[i];
      items.push({
        glAccountId: el?.glAccountId?.toString(),
        glLineType: el?.glLineType,
        amount: roundOffNumber(el?.amount, 3),
        description: '',
      });
    }

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: openingBal.addedBy,
            supplierId: openingBal.supplierId,
          },
        },
        {
          restaurantId: openingBal.restaurantId.toString(),
          referenceNumber: openingBal._id.toString(),
          referenceDocNumber: openingBal.docNumber?.toString(),
          type: GlVoucherType.OpeningBalance,
          date: openingBal?.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Opening Balance - ${openingBal._id}`,
        err,
      );
    }
    if (glVoucher) {
      openingBal.glVoucherId = glVoucher._id;
      openingBal.save();
    }
  }

  // async handleEmployeeHourlyRate(empDoc: EmpTimeSheetDocument, amount: number) {

  //   const mapping = await this.glAccountMappingModel.findOne({
  //     supplierId: empDoc.supplierId,
  //   });

  //   if (!mapping) {
  //     console.log(
  //       `Gl Account Mapping not found for supplier - ${empDoc.supplierId}`,
  //     );
  //     return;
  //   }

  //   const items: CreateGlVoucherItemDto[] = [];
  //   const salaryExpense: GlMappingDetail = this.findGlAccount(
  //     mapping,
  //     'salaryExpense',
  //   );

  //   const salaryAccural: GlMappingDetail = this.findGlAccount(
  //     mapping,
  //     'salaryAccural',
  //   );

  //   items.push({
  //     glAccountId: salaryExpense?.glAccount?.toString(),
  //     glLineType: GlLineType.DR,
  //     amount: roundOffNumber(amount, 3),
  //     description: '',
  //     ...salaryExpense
  //   });

  //   items.push({
  //     glAccountId: salaryAccural?.glAccount?.toString(),
  //     glLineType: GlLineType.CR,
  //     amount: roundOffNumber(amount, 3),
  //     description: '',
  //     ...salaryAccural
  //   });

  //   let glVoucher;
  //   try {
  //     glVoucher = await this.glVoucherService.create(
  //       {
  //         user: {
  //           userId: empDoc.addedBy,
  //           supplierId: empDoc.supplierId,
  //         },
  //       },
  //       {
  //         restaurantId: empDoc.restaurantId.toString(),
  //         referenceNumber: empDoc._id.toString(),
  //         referenceDocNumber: empDoc.docNumber?.toString(),
  //         type: GlVoucherType.SalaryAccural,
  //         date: new Date(),
  //         items,
  //       },
  //     );
  //   } catch (err) {
  //     console.log(
  //       `Failed to create gl voucher for Emp Salary`,
  //       err,
  //     );
  //   }

  //   if (glVoucher) {
  //     empDoc.glVoucherId = glVoucher._id;
  //     empDoc.save();
  //   }

  // }

  async handlePaymentBankFees(bankDoc: PaymentFeesDocument) {
    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: bankDoc.supplierId,
    });

    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${bankDoc.supplierId}`,
      );
      return;
    }

    const items: CreateGlVoucherItemDto[] = [];
    const drInputTaxAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'drInputTax',
    );

    items.push({
      glAccountId: drInputTaxAccount?.glAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(bankDoc.totalTax, 3),
      description: '',
      ...drInputTaxAccount
    });

    items.push({
      glAccountId: bankDoc.glAccountIdFees?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(bankDoc.totalFees, 3),
      description: ''
    });

    items.push({
      glAccountId: bankDoc.glAccountIdBank?.toString(),
      glLineType: GlLineType.CR,
      amount: roundOffNumber(roundOffNumber(bankDoc.totalTax, 3) + roundOffNumber(bankDoc.totalFees, 3), 3),
      description: ''
    });

    let glVoucher;
    try {
      glVoucher = await this.glVoucherService.create(
        {
          user: {
            userId: bankDoc.addedBy,
            supplierId: bankDoc.supplierId,
          },
        },
        {
          restaurantId: bankDoc.restaurantId?.toString(),
          referenceNumber: bankDoc._id.toString(),
          referenceDocNumber: bankDoc.docNumber?.toString(),
          type: GlVoucherType.PaymentBankFees,
          date: bankDoc.paymentDate,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for handlePaymentBankFees`,
        err,
      );
    }

    if (glVoucher) {
      bankDoc.glVoucherId = glVoucher._id;
      bankDoc.save();
    }
  }


  async handleMonthlyTimeSheet(empDoc: EmpMonthlySalaryDocument) {

    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: empDoc.supplierId,
    });

    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${empDoc.supplierId}`,
      );
      return;
    }

    let items: CreateGlVoucherItemDto[] = [];
    const salaryExpense: GlMappingDetail = this.findGlAccount(
      mapping,
      'salaryExpense',
    );

    items.push({
      glAccountId: salaryExpense?.glAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(empDoc.totalAmount, 3),
      description: '',
      ...salaryExpense
    });

    if (empDoc.paymentType == 'Other') {
      items.push({
        glAccountId: empDoc.glAccountId?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(empDoc.totalAmount, 3),
        description: ''
      });
    } else {
      const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        empDoc.paymentType,
      );

      items.push({
        glAccountId: paymentMethodAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(empDoc.totalAmount, 3),
        description: '',
        ...paymentMethodAccount,
      });
    }

    let glVoucherPR;
    try {
      glVoucherPR = await this.glVoucherService.create(
        {
          user: {
            userId: empDoc.addedBy,
            supplierId: empDoc.supplierId,
          },
        },
        {
          restaurantId: empDoc.restaurantId.toString(),
          referenceNumber: empDoc._id.toString(),
          referenceDocNumber: empDoc.docNumber?.toString(),
          type: GlVoucherType.MonthlyPayRoll,
          description: 'PayRoll',
          date: empDoc.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Emp Salary`,
        err,
      );
    }

    if (glVoucherPR) {
      empDoc.glVoucherId = glVoucherPR._id;
      empDoc.save();
    }
  }

  async handleAssetAuqTransaction(assetAuqTrans: any, assetAuqTransResp: AssetAquTransDocument) {

    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: assetAuqTrans.supplierId,
    });

    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${assetAuqTrans.supplierId}`,
      );
      return;
    }

    let items: CreateGlVoucherItemDto[] = [];
    const assetGLAccount: GlAssetCodes = this.findGlAccount(
      mapping,
      assetAuqTrans?.assetAquId?.glAssetCategoryId?.glAssetCodeId?.toString(),
      'assetCode',
    );

    items.push({
      glAccountId: assetGLAccount?.assetAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(assetAuqTrans.net, 3),
      description: '',
      ...assetGLAccount
    });
    const inputTaxAccount: GlMappingDetail = this.findGlAccount(
      mapping,
      'drInputTax',
    );
    items.push({
      glAccountId: inputTaxAccount?.glAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(assetAuqTrans.tax, 3),
      description: '',
      ...inputTaxAccount,
    });

    if (assetAuqTrans.paymentType == 'Other') {
      items.push({
        glAccountId: assetAuqTrans?.glAccountId?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(assetAuqTrans.grossAmount, 3),
        description: ''
      });
    } else if (assetAuqTrans.paymentType == 'Credit') {
      const glVendorRef: GlVenCodes = this.findGlAccount(
        mapping,
        assetAuqTrans?.vendorId?.glVendorCodeId?.toString(),
        'glVenCode',
      );
      items.push({
        glAccountId: glVendorRef?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(assetAuqTrans.grossAmount, 3),
        description: '',
        ...glVendorRef,
      });
    } else {
      const paymentMethodAccount: GlMappingDetail = this.findGlAccount(
        mapping,
        assetAuqTrans.paymentType,
      );
      items.push({
        glAccountId: paymentMethodAccount?.glAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(assetAuqTrans.grossAmount, 3),
        description: '',
        ...paymentMethodAccount,
      });
    }

    let glVoucherPR;
    try {
      glVoucherPR = await this.glVoucherService.create(
        {
          user: {
            userId: assetAuqTrans.addedBy,
            supplierId: assetAuqTrans.supplierId,
          },
        },
        {
          restaurantId: assetAuqTrans?.assetAquId?.restaurantId?.toString(),
          referenceNumber: assetAuqTrans._id.toString(),
          referenceDocNumber: assetAuqTrans.docNumber?.toString(),
          type: GlVoucherType.AssetAcquisition,
          description: '',
          date: assetAuqTrans.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Emp Salary`,
        err,
      );
    }
    if (glVoucherPR) {
      assetAuqTransResp.glVoucherId = glVoucherPR._id;
      assetAuqTransResp.save();
    }

  }

  async handleAssetRetirement(assetRetirement: AssetRetirementDocument, retirementResp: AssetRetirementDocument) {

    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: assetRetirement.supplierId,
    });

    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${assetRetirement.supplierId}`,
      );
      return;
    }
    let items: CreateGlVoucherItemDto[] = [];
    const assetGLAccount: GlAssetCodes = this.findGlAccount(
      mapping,
      assetRetirement?.assetAquId?.glAssetCategoryId?.glAssetCodeId?.toString(),
      'assetCode',
    );

    items.push({
      glAccountId: assetGLAccount?.retirementLossAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(assetRetirement.nbvAmount, 3),
      description: '',
      ...assetGLAccount
    });

    items.push({
      glAccountId: assetGLAccount?.accumulatedAccount?.toString(),
      glLineType: GlLineType.DR,
      amount: roundOffNumber(assetRetirement.accumlatedAmount, 3),
      description: '',
      ...assetGLAccount,
    });

    items.push({
      glAccountId: assetGLAccount?.assetAccount?.toString(),
      glLineType: GlLineType.CR,
      amount: roundOffNumber(assetRetirement.aquisitionAmount, 3),
      description: '',
      ...assetGLAccount,
    });

    let glVoucherPR;
    try {
      glVoucherPR = await this.glVoucherService.create(
        {
          user: {
            userId: assetRetirement.addedBy,
            supplierId: assetRetirement.supplierId,
          },
        },
        {
          restaurantId: assetRetirement?.assetAquId?.restaurantId?.toString(),
          referenceNumber: assetRetirement._id.toString(),
          referenceDocNumber: assetRetirement.docNumber?.toString(),
          type: GlVoucherType.AssetRetirement,
          description: '',
          date: assetRetirement.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Emp Salary`,
        err,
      );
    }
    if (glVoucherPR) {
      retirementResp.glVoucherId = glVoucherPR._id;
      retirementResp.save();
    }
  }

  async handleAssetDepreciation(assetDep: any, assetDepDoc: AssetAquDepDocument) {

    const mapping = await this.glAccountMappingModel.findOne({
      supplierId: assetDep.supplierId,
    });

    if (!mapping) {
      console.log(
        `Gl Account Mapping not found for supplier - ${assetDep.supplierId}`,
      );
      return;
    }

    let items: CreateGlVoucherItemDto[] = [];

    let tempItem: any = [];

    let restaurantId = '';

    for (let i = 0; i < assetDep?.items?.length; i++) {
      const el = assetDep?.items[i];

      const assetGLAccount: GlAssetCodes = this.findGlAccount(
        mapping,
        el?.assetAquId?.glAssetCategoryId?.glAssetCodeId?.toString(),
        'assetCode',
      );

      tempItem.push({
        glAccountId: assetGLAccount?.depreciationExpenseAccount?.toString(),
        glLineType: GlLineType.DR,
        amount: roundOffNumber(el.amount, 3)
      });

      tempItem.push({
        glAccountId: assetGLAccount?.accumulatedAccount?.toString(),
        glLineType: GlLineType.CR,
        amount: roundOffNumber(el.amount, 3)
      });

      restaurantId = el?.assetAquId?.restaurantId
    }

    const groupedTempItem = tempItem.reduce((result, item) => {
      const key = `${item.glAccountId}_${item.glLineType}`;
      if (!result[key]) {
        result[key] = { ...item, amount: 0 };
      }
      result[key].amount += item.amount;
      return result;
    }, {} as Record<string, any>);

    // Converting the grouped object back to an array
    const groupedArray: any = Object.values(groupedTempItem);


    items = groupedArray.map(elx => ({
      glAccountId: elx.glAccountId,
      glLineType: elx.glLineType,
      amount: elx.amount,
      description: ''
    }));


    let glVoucherPR;
    try {
      glVoucherPR = await this.glVoucherService.create(
        {
          user: {
            userId: assetDep.addedBy,
            supplierId: assetDep.supplierId,
          },
        },
        {
          restaurantId: restaurantId,
          referenceNumber: assetDep._id.toString(),
          referenceDocNumber: assetDep.docNumber?.toString(),
          type: GlVoucherType.AssetDepreciation,
          description: '',
          date: assetDep.date,
          items,
        },
      );
    } catch (err) {
      console.log(
        `Failed to create gl voucher for Emp Salary`,
        err,
      );
    }
    if (glVoucherPR) {
      assetDepDoc.glVoucherId = glVoucherPR._id;
      assetDepDoc.save();
    }

  }
  findGlAccount(
    mapping: GlAccountMappingDocument,
    type: string,
    subType: string = null,
  ) {
    let glAccountId = null;
    if (type == PaymentMethod.Cash) {
      glAccountId = mapping.cash;
    } else if (type == PaymentMethod.Card) {
      glAccountId = mapping.card;
    } else if (type == PaymentMethod.Card) {
      glAccountId = mapping.card;
    } else if (type == PaymentMethod.Online) {
      glAccountId = mapping.online;
    } else if (type == PaymentMethod.POS) {
      glAccountId = mapping.softPos;
    } else if (type == 'Bank') {
      glAccountId = mapping.bank;
    }
    else if (type == 'deferred') {
      glAccountId = mapping.deferred;
    } else if (type == 'accountReceivable') {
      glAccountId = mapping.accountReceivable;
    } else if (type == 'crRevenue') {
      glAccountId = mapping.crRevenue;
    } else if (type == 'crShishaTax') {
      glAccountId = mapping.crShishaTax;
    } else if (type == 'crOutputTax') {
      glAccountId = mapping.crOutputTax;
    } else if (type == 'drInputTax') {
      glAccountId = mapping.drInputTax;
    } else if (type == 'wasteExpense') {
      glAccountId = mapping.wasteExpense;
    } else if (type == 'taxClearing') {
      glAccountId = mapping.taxClearing;
    } else if (type == 'customerAccountReceivables') {
      glAccountId = mapping.customerAccountReceivables;
    } else if (type == 'sfInterCompany') {
      glAccountId = mapping.sfInterCompany;
    } else if (type == 'cogsAccount') {
      glAccountId = mapping.cogsAccount;
    } else if (type == 'gainAndLoss') {
      glAccountId = mapping.gainAndLoss;
    } else if (type === 'avgPriceChange') {
      glAccountId = mapping.avgPriceChange;
    } else if (type === 'salaryAccural') {
      glAccountId = mapping.salaryAccural;
    } else if (type === 'salaryExpense') {
      glAccountId = mapping.salaryExpense;
    }
    else if (type === 'consumptionGlAccount') {
      glAccountId = mapping.consumptionGlAccount;
    }
    else if (type === 'employeeExpense') {
      glAccountId = mapping.employeeExpense;
    }

    if (subType == 'purchaseCategory') {
      const purchaseCategory = mapping.purchaseCategories.find(
        (c) => c.category.toString() == type,
      );
      if (purchaseCategory) {
        glAccountId = purchaseCategory;
      }
    } else if (subType == 'glVenCode') {
      const glVenCode = mapping.glVenCodes.find(
        (c) => c.glVenCodeId.toString() == type,
      );
      if (glVenCode) {
        glAccountId = glVenCode;
      }
    } else if (subType == 'materialCode') {
      glAccountId = mapping.materialCodes.find(
        (c) => c.glMatCodeId.toString() == type,
      );
    }
    else if (subType == 'revenueCode') {
      glAccountId = mapping.glRevenueCodes.find(
        (c) => c.glRevenueCodeId.toString() == type,
      );
    }
    else if (subType == 'assetCode') {
      glAccountId = mapping.glAssetCodes.find(
        (c) => c.glAssetCodeId.toString() == type,
      );
    }
    else if (subType == 'glTaxIndicationCode') {
      glAccountId = mapping.glTaxIndicationCodes.find(
        (c) => c.glTaxIndicationId.toString() == type,
      );
    }

    return glAccountId;
  }
}
