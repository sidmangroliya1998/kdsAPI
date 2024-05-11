import { Module } from '@nestjs/common';
import { InvoiceReceiptService } from './invoice-receipt.service';
import { InvoiceReceiptController } from './invoice-receipt.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GoodsReceipt,
  GoodsReceiptSchema,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptSchema,
} from './schema/invoice-receipt.schema';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from 'src/purchase-order/schemas/purchase-order.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { IRVI, IRVISchema } from './schema/ir-vi.schema';
import { ManualVendorInvoice, ManualVendorInvoiceSchema } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualCustomerInvoice, ManualCustomerInvoiceSchema } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: IRVI.name, schema: IRVISchema },
      { name: ManualVendorInvoice.name, schema: ManualVendorInvoiceSchema },
      { name: ManualCustomerInvoice.name, schema: ManualCustomerInvoiceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AccountingModule,
    InventoryModule
  ],
  controllers: [InvoiceReceiptController],
  providers: [InvoiceReceiptService],
  exports:[InvoiceReceiptService]
})
export class InvoiceReceiptModule {}
