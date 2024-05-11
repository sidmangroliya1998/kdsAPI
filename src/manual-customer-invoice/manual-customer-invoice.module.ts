import { Module } from '@nestjs/common';
import { ManualCustomerInvoiceService } from './manual-customer-invoice.service';
import { ManualCustomerInvoiceController } from './manual-customer-invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceSchema,
} from './schemas/manual-customer-invoice.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { ManualCustomerPaymentModule } from 'src/manual-customer-payment/manual-customer-payment.module';
import { TemplateResolverService } from 'src/template-resolver/template-resolver.service';
import { FatooraService } from 'src/invoice/fatoora.service';
import { NotificationHelperService } from 'src/notification/notification-helper.service';
import { TemplateResolverModule } from 'src/template-resolver/template-resolver.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ManualCustomerPaymentHistory, ManualCustomerPaymentHistorySchema } from 'src/manual-customer-payment/schemas/manual-customer-pay-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ManualCustomerInvoice.name, schema: ManualCustomerInvoiceSchema },
      { name: User.name, schema: UserSchema },
      { name: ManualCustomerPaymentHistory.name, schema: ManualCustomerPaymentHistorySchema }
    ]),
    AccountingModule,
    ManualCustomerPaymentModule,
    TemplateResolverModule,
    NotificationModule
  ],
  controllers: [ManualCustomerInvoiceController],
  providers: [ManualCustomerInvoiceService,
    FatooraService],
  exports: [ManualCustomerInvoiceService]
})
export class ManualCustomerInvoiceModule { }
