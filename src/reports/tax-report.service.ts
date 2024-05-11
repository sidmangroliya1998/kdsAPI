import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import { SalesReportDto, ShishaTaxReportDto } from './dto/sales-report.dto';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { Expense, ExpenseDocument } from 'src/expense/schemas/expense.schema';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import * as uniqid from 'uniqid';
import { S3Service } from 'src/core/Providers/Storage/S3.service';
import {
  InvoiceStatus,
  OrderPaymentStatus,
  OrderStatus,
} from 'src/order/enum/en.enum';
import { Purchase, PurchaseDocument } from 'src/purchase/schemas/purchase.schema';
import { AssetAquTrans, AssetAquTransDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu-transaction.schema';
import { InvoiceReceipt, InvoiceReceiptDocument } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { TransStatus } from 'src/core/Constants/enum';
import { ManualVendorInvoice, ManualVendorInvoiceDocument } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualCustomerInvoice, ManualCustomerInvoiceDocument } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
@Injectable()
export class TaxReportService {
  constructor(
    private readonly s3Service: S3Service,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<PurchaseDocument>,
    @InjectModel(InvoiceReceipt.name)
    private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
    @InjectModel(AssetAquTrans.name)
    private readonly assetAquisitionModel: Model<AssetAquTransDocument>,
    @InjectModel(ManualVendorInvoice.name)
    private readonly manualVendorInvoiceModel: Model<ManualVendorInvoiceDocument>,
    @InjectModel(ManualCustomerInvoice.name)
    private readonly manualCustomerInvoiceModel: Model<ManualCustomerInvoiceDocument>,

  ) { }

  async shishaTaxReport(req, dto: ShishaTaxReportDto) {

    let queryToApply: any = {};
    if (dto.restaurantIds && dto.restaurantIds.length > 0)
      queryToApply.restaurantId = {
        $in: dto.restaurantIds.map((r) => new mongoose.Types.ObjectId(r)),
      };
    if (dto.startDate && dto.endDate) {
      dto.startDate.setUTCHours(0);
      dto.startDate.setUTCMinutes(0);
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(59);
    }
    const response = {
      subTotal: 0,
      vat: 0,
      totalWithTax: 0,
      totalShishaFee: 0,
      shishaTaxable: 0,
    };
    queryToApply.invoiceStatus = InvoiceStatus.Invoiced;
    if (dto.fetchForAll) {
      delete queryToApply.invoiceStatus;
    }

    const order = await this.orderModel.aggregate([
      {
        $match: {
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
          $and: [
            { "summary.totalFee": { $exists: true, $gt: 0 } },
            { "summary.totalShishaSales": { $exists: true, $gt: 0 } }
          ],
          ...queryToApply
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$summary.totalShishaSales" },
          totalShishaFee: { $sum: "$summary.totalFee" }
        }
      }
    ]);

    // const order = await this.orderModel.aggregate([
    //   {
    //     $match: {
    //       createdAt: { $gte: dto.startDate, $lt: dto.endDate },
    //       supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
    //       paymentStatus: {
    //         $in: [
    //           OrderPaymentStatus.Paid,
    //           OrderPaymentStatus.OverPaid,
    //           OrderPaymentStatus.PartiallyRefunded,
    //           OrderPaymentStatus.PartiallyPaid
    //         ]
    //       },
    //       status: {
    //         $nin: [
    //           OrderStatus.Cancelled,
    //           OrderStatus.CancelledByMerge,
    //           OrderStatus.CancelledWihPaymentFailed,
    //         ],
    //       },
    //       ...queryToApply
    //     }
    //   },
    //   { $unwind: "$items" },
    //   {
    //     $lookup: {
    //       from: "menucategories",
    //       localField: "items.menuItem.categoryId",
    //       foreignField: "_id",
    //       as: "categoryDetails"
    //     }
    //   },
    //   { $unwind: "$categoryDetails" },
    //   { $match: { "categoryDetails.feeRate": { $gt: 0 } } }, // Match only categories with feeRate > 0
    //   {
    //     $addFields: {
    //       "items.totalShishaFee": { $max: [{ $divide: ["$items.amountAfterDiscount", 2] }, 25] }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalSales: { $sum: "$items.amountAfterDiscount" },
    //       totalShishaFee: { $sum: "$items.totalShishaFee" }
    //     }
    //   }
    // ]);

    if (order && order.length > 0) {
      response.totalWithTax = roundOffNumber(order[0].totalSales);
      response.vat = 0;
      response.shishaTaxable = roundOffNumber(order[0].totalShishaFee);
      response.subTotal = 0;
      response.totalShishaFee = roundOffNumber(order[0].totalShishaFee);
    }
    return response;
  }
  async shishaTaxReportExport(req: any) {
    let templateHtml = fs.readFileSync(
      'src/reports/templates/shishatax.html',
      'utf8',
    );

    const template = Handlebars.compile(templateHtml);
    const html = template({
      restaurantname: req.businessname,
      startDt: req.startDt,
      endDt: req.endDt,
      totalWithTax: req.totalWithTax,
      shishaTax: req.shishaTax,
      vat: req.vat,
      subTotal: req.subTotal,
      vatno: req.vatno,
    });

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disk-cache-dir=/tmp/',
        '--disable-gpu',
      ],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'load' });

    const pdfPath =
      './upload/' + (await uniqid.process().toUpperCase()) + '.pdf';
    await page.pdf({
      format: 'A4',
      path: pdfPath,
    });
    browser.close();
    const s3Url: any = await this.s3Service.uploadLocalFile(
      pdfPath,
      'taxreport/',
    );
    return s3Url.Location;
  }
  async zatkaTaxReport(req, dto: SalesReportDto) {
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
      // dto.startDate = new Date(
      //   dto.startDate.toLocaleString('en', { timeZone: timezone }),
      // );
      dto.endDate.setUTCHours(23);
      dto.endDate.setUTCMinutes(60);
      // dto.endDate = new Date(
      //   dto.endDate.toLocaleString('en', { timeZone: timezone }),
      // );


    }
    const response = {
      sales: {
        subTotal: 0,
        vat: 0,
        totalWithTax: 0,
      },
      refund: {
        subTotal: 0,
        vat: 0,
        totalWithTax: 0,
      },
      expense: {
        subTotal: 0,
        vat: 0,
        totalWithTax: 0,
      },
      purchase: {
        subTotal: 0,
        vat: 0,
        totalWithTax: 0,
      },
    };
    const order = await this.orderModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          invoiceStatus: { $ne: null },
          createdAt: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          }
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: { $sum: '$summary.totalWithTax' },
          refund: { $sum: '$summary.totalRefunded' },
        },
      },
    ]);
    const expense = await this.expenseModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          'items.tax': {
            $gt: 0,
          },
          date: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          },
          transType: TransStatus.Approved
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: {
              $cond: [{ $gt: ['$items.tax', 0] }, '$items.grossAmount', 0],
            },
          },
          subTotal: {
            $sum: {
              $cond: [{ $gt: ['$items.tax', 0] }, '$items.net', 0],
            },
          },
          vat: {
            $sum: {
              $cond: [{ $gt: ['$items.tax', 0] }, '$items.tax', 0],
            },
          },
        },
      },
    ]);

    const purchaseData = await this.purchaseModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          'items.tax': {
            $gt: 0,
          },
          date: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          },
          transType: TransStatus.Approved
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: {
              $cond: [{ $gt: ['$items.tax', 0] }, '$items.grossAmount', 0],
            },
          },
          subTotal: {
            $sum: {
              $cond: [{ $gt: ['$items.tax', 0] }, '$items.net', 0],
            },
          },
          vat: {
            $sum: {
              $cond: [{ $gt: ['$items.tax', 0] }, '$items.tax', 0],
            },
          },
        },
      },
    ])
    const purchaseOrder = await this.invoiceReceiptModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          date: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          },
          transType: TransStatus.Approved
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: '$totalCost',
          },
          vat: {
            $sum: '$tax'
          }
        },
      },
    ]);

    const assetAqu = await this.assetAquisitionModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          createdAt: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          },
          'tax': {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: {
              $cond: [{ $gt: ['$tax', 0] }, '$amount', 0],
            },
          },
          subTotal: {
            $sum: {
              $cond: [{ $gt: ['$tax', 0] }, '$grossAmount', 0],
            },
          },
          vat: {
            $sum: {
              $cond: [{ $gt: ['$tax', 0] }, '$tax', 0],
            },
          },
        },
      },
    ]);

    const vendorInvoice = await this.manualVendorInvoiceModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          tax: {
            $gt: 0,
          },
          date: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          },
          transType: TransStatus.Approved,
          isReturn: false
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: '$totalCost',
          },
          subTotal: {
            $sum: '$amount',
          },
          vat: {
            $sum: '$tax',
          },
        },
      },
    ]);

    const customerInvoice = await this.manualCustomerInvoiceModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
          tax: {
            $gt: 0,
          },
          date: {
            $gte: dto.startDate,
            $lte: dto.endDate,
          },
          transType: TransStatus.Approved,
          isReturn: false
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: '$totalCost',
          },
          subTotal: {
            $sum: '$netAmount',
          },
          vat: {
            $sum: '$tax',
          },
        },
      },
    ])

    if (order && order.length > 0) {
      response.sales.totalWithTax = order[0].totalWithTax;
      response.sales.subTotal = roundOffNumber(
        order[0].totalWithTax / (1 + (supplier.taxRate ?? Tax.rate) / 100),
      );
      response.sales.vat = roundOffNumber(
        (response.sales.subTotal * (supplier.taxRate ?? Tax.rate)) / 100,
      );

      response.refund.totalWithTax = order[0].refund;
      response.refund.subTotal = roundOffNumber(
        order[0].refund / (1 + (supplier.taxRate ?? Tax.rate) / 100),
      );
      response.refund.vat = roundOffNumber(
        (response.refund.subTotal * (supplier.taxRate ?? Tax.rate)) / 100,
      );
    }
    if (expense && expense.length > 0) {
      response.expense.totalWithTax = roundOffNumber(expense[0].totalWithTax);
      response.expense.subTotal = roundOffNumber(expense[0].subTotal);
      response.expense.vat = roundOffNumber(expense[0].vat);
    }
    if (purchaseData && purchaseData.length > 0) {
      response.purchase.totalWithTax = roundOffNumber(purchaseData[0].totalWithTax);
      response.purchase.subTotal = roundOffNumber(purchaseData[0].subTotal);
      response.purchase.vat = roundOffNumber(purchaseData[0].vat);
    }
    if (purchaseOrder && purchaseOrder.length > 0) {
      response.purchase.totalWithTax += roundOffNumber(purchaseOrder[0].totalWithTax);
      response.purchase.subTotal += roundOffNumber(purchaseOrder[0].totalWithTax - purchaseOrder[0].vat);
      response.purchase.vat += roundOffNumber(purchaseOrder[0].vat);
    }
    if (assetAqu && assetAqu.length > 0) {
      response.purchase.totalWithTax += roundOffNumber(assetAqu[0].totalWithTax);
      response.purchase.subTotal += roundOffNumber(assetAqu[0].totalWithTax - assetAqu[0].vat);
      response.purchase.vat += roundOffNumber(assetAqu[0].vat);
    }
    if (vendorInvoice && vendorInvoice.length > 0) {
      response.purchase.totalWithTax += roundOffNumber(vendorInvoice[0].totalWithTax);
      response.purchase.subTotal += roundOffNumber(vendorInvoice[0].subTotal);
      response.purchase.vat += roundOffNumber(vendorInvoice[0].vat);
    }
    if (customerInvoice && customerInvoice.length > 0) {
      response.sales.totalWithTax += roundOffNumber(customerInvoice[0].totalWithTax);
      response.sales.subTotal += roundOffNumber(customerInvoice[0].subTotal);
      response.sales.vat+= roundOffNumber(customerInvoice[0].vat);
    }
    return response;
  }

  async zatkaTaxReportExport(req: any) {
    let templateHtml = fs.readFileSync(
      'src/reports/templates/zatkatax.html',
      'utf8',
    );

    const template = Handlebars.compile(templateHtml);
    const html = template({
      restaurantname: req.businessname,
      startDt: req.startDt,
      endDt: req.endDt,
      expense: req.expense,
      purchase: req.purchase,
      refund: req.refund,
      sales: req.sales,
      finalAmount: req.finalAmount,
      vatno: req.vatno,
    });

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disk-cache-dir=/tmp/',
        '--disable-gpu',
      ],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'load' });

    const pdfPath =
      './upload/' + (await uniqid.process().toUpperCase()) + '.pdf';
    await page.pdf({
      format: 'A4',
      path: pdfPath,
    });
    browser.close();
    const s3Url: any = await this.s3Service.uploadLocalFile(
      pdfPath,
      'taxreport/',
    );
    return s3Url.Location;
  }
}
