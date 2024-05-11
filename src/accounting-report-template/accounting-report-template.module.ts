import { Module } from '@nestjs/common';
import { AccountingReportTemplateService } from './accounting-report-template.service';
import { AccountingReportTemplateController } from './accounting-report-template.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccountingReportTemplate,
  AccountingReportTemplateSchema,
} from './schemas/accounting-report-template.schema';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AccountingReportTemplate.name,
        schema: AccountingReportTemplateSchema,
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
  controllers: [AccountingReportTemplateController],
  providers: [AccountingReportTemplateService],
})
export class AccountingReportTemplateModule {}
