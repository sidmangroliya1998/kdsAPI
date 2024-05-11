import { Module } from '@nestjs/common';
import { ManualVendorPaymentService } from './manual-vendor-payment.service';
import { ManualVendorPaymentController } from './manual-vendor-payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ManualVendorPayment,
  ManualVendorPaymentSchema,
} from './schemas/manual-vendor-payment.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import {
  ManualVendorInvoice,
  ManualVendorInvoiceSchema,
} from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptSchema,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { PurchaseOrder, PurchaseOrderSchema } from 'src/purchase-order/schemas/purchase-order.schema';
import { IRVI, IRVISchema } from 'src/invoice-receipt/schema/ir-vi.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ManualVendorPayment.name, schema: ManualVendorPaymentSchema },
      { name: ManualVendorInvoice.name, schema: ManualVendorInvoiceSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: IRVI.name, schema: IRVISchema },
      { name: User.name, schema: UserSchema },
    ]),
    AccountingModule,
  ],
  controllers: [ManualVendorPaymentController],
  providers: [ManualVendorPaymentService],
  exports: [ManualVendorPaymentService],
})
export class ManualVendorPaymentModule { }
