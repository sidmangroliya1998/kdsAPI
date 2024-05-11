import { Module } from '@nestjs/common';
import { ManualCustomerPaymentService } from './manual-customer-payment.service';
import { ManualCustomerPaymentController } from './manual-customer-payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ManualCustomerPayment,
  ManualCustomerPaymentSchema,
} from './schemas/manual-customer-payment.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceSchema,
} from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptSchema,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { ManualCustomerPaymentHistory, ManualCustomerPaymentHistorySchema } from './schemas/manual-customer-pay-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ManualCustomerPayment.name, schema: ManualCustomerPaymentSchema },
      { name: ManualCustomerInvoice.name, schema: ManualCustomerInvoiceSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: User.name, schema: UserSchema },
      { name: ManualCustomerPaymentHistory.name, schema: ManualCustomerPaymentHistorySchema }
    ]),
    AccountingModule,
  ],
  controllers: [ManualCustomerPaymentController],
  providers: [ManualCustomerPaymentService],
  exports: [ManualCustomerPaymentService]
})
export class ManualCustomerPaymentModule { }
