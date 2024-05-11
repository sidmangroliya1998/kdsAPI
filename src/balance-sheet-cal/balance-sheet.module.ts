import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlAccountModule } from 'src/gl-account/gl-account.module';
import { GlVoucher, GlVoucherSchema } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountMapping, GlAccountMappingSchema } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { BalanceSheetTemplate, BalanceSheetTemplateSchema } from './schema/balance-sheet-template.schema';
import { BalanceSheetController } from './balance-sheet.controller';
import { BalanceSheetService } from './balance-sheet.service';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: BalanceSheetTemplate.name, schema: BalanceSheetTemplateSchema },
            {
                name: GlVoucher.name,
                schema: GlVoucherSchema,
            },
            { name: GlAccountMapping.name, schema: GlAccountMappingSchema },

        ]),
        GlAccountModule
    ],
    controllers: [BalanceSheetController],
    providers: [BalanceSheetService],
    exports: [BalanceSheetService],
})

export class BalanceSheetModule { }
