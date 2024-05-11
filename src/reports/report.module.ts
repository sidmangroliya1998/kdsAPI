import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import {
  Reservation,
  ReservationSchema,
} from 'src/reservation/schemas/reservation.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/schemas/transactions.schema';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { GlobalConfigModule } from 'src/global-config/global-config.module';
import { SalesReportService } from './sales-report.service';
import {
  Supplier,
  SupplierSchema,
} from 'src/supplier/schemas/suppliers.schema';
import { PaymentReportService } from './payment-report.service';
import { TaxReportService } from './tax-report.service';
import { Expense, ExpenseSchema } from 'src/expense/schemas/expense.schema';
import { StorageModule } from 'src/core/Providers/Storage/storage.module';
import { GoodsReceipt, GoodsReceiptSchema } from 'src/goods-receipt/schemas/goods-receipt.schema';
import { InvoiceReceipt, InvoiceReceiptSchema } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { Purchase, PurchaseSchema } from 'src/purchase/schemas/purchase.schema';
import { AssetAquTrans, AssetAquTransSchema } from 'src/asset-management/asset-aqu/schemas/asset-aqu-transaction.schema';
import { ManualVendorInvoice, ManualVendorInvoiceSchema } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualCustomerInvoice, ManualCustomerInvoiceSchema } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';

@Module({
  imports: [
    StorageModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: AssetAquTrans.name, schema: AssetAquTransSchema },
      { name: ManualVendorInvoice.name, schema: ManualVendorInvoiceSchema },
      { name: ManualCustomerInvoice.name, schema: ManualCustomerInvoiceSchema },
    ]),
    GlobalConfigModule,
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    SalesReportService,
    PaymentReportService,
    TaxReportService,
  ],
  exports: [ReportService],
})
export class ReportModule { }
