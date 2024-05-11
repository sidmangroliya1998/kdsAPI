import { Module } from '@nestjs/common';
import { PaymentSetupService } from './payment-setup.service';
import { PaymentSetupController } from './payment-setup.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentSetup,
  PaymentSetupSchema,
} from './schemas/payment-setup.schema';
import { PaymentBankFees, PaymentBankFeesSchema } from './schemas/payment-bank-fees.schema';
import { PaymentFees, PaymentFeesSchema } from './schemas/payment-fees.schema';
import { AccountingModule } from 'src/accounting/accounting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentSetup.name, schema: PaymentSetupSchema },
      { name: PaymentBankFees.name, schema: PaymentBankFeesSchema },
      { name: PaymentFees.name, schema: PaymentFeesSchema }
    ]),
    AccountingModule
  ],
  controllers: [PaymentSetupController],
  providers: [PaymentSetupService],
  exports: [PaymentSetupService],
})
export class PaymentSetupModule { }
