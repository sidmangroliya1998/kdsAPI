import { Module } from '@nestjs/common';
import { ManualVendorInvoiceService } from './manual-vendor-invoice.service';
import { ManualVendorInvoiceController } from './manual-vendor-invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ManualVendorInvoice,
  ManualVendorInvoiceSchema,
} from './schemas/manual-vendor-invoice.schema';
import { AccountingModule } from '../accounting/accounting.module';
import { PurchaseOrder, PurchaseOrderSchema } from 'src/purchase-order/schemas/purchase-order.schema';
import { IRVI, IRVISchema } from 'src/invoice-receipt/schema/ir-vi.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { ManualVendorPaymentModule } from 'src/manual-vendor-payment/manual-vendor-payment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ManualVendorInvoice.name, schema: ManualVendorInvoiceSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: IRVI.name, schema: IRVISchema },
      { name: User.name, schema: UserSchema },
    ]),
    AccountingModule,
    ManualVendorPaymentModule
  ],
  controllers: [ManualVendorInvoiceController],
  providers: [ManualVendorInvoiceService],
  exports:[ManualVendorInvoiceService]
})
export class ManualVendorInvoiceModule {}
