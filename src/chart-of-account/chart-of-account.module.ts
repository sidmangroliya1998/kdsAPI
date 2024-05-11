import { Module } from '@nestjs/common';
import { ChartOfAccountService } from './chart-of-account.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChartOfAccount,
  ChartOfAccountSchema,
} from './schemas/chart-of-account.schema';
import {
  GlVoucher,
  GlVoucherSchema,
} from 'src/accounting/schemas/gl-voucher.schema';
import {
  GlAccountSet,
  GlAccountSetSchema,
} from 'src/gl-account-set/schemas/gl-account-set.schema';
import {
  GlAccount,
  GlAccountSchema,
} from 'src/gl-account/schemas/gl-account.schema';
import { ChartOfAccountController } from './chart-of-account.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ChartOfAccount.name,
        schema: ChartOfAccountSchema,
      },
      {
        name: GlVoucher.name,
        schema: GlVoucherSchema,
      },
      {
        name: GlAccountSet.name,
        schema: GlAccountSetSchema,
      },
      {
        name: GlAccount.name,
        schema: GlAccountSchema,
      },
    ]),
  ],
  controllers: [ChartOfAccountController],
  providers: [ChartOfAccountService],
  exports: [ChartOfAccountService]
})
export class ChartOfAccountModule { }
