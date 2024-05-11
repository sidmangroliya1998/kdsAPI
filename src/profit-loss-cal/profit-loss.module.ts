import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlVoucher, GlVoucherSchema } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountMapping, GlAccountMappingSchema } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { EmpTimeSheet, EmpTimeSheetSchema } from 'src/employee-mgmt/schemas/emp-hourly-timesheet.schema';
import { Emp, EmpSchema } from 'src/employee-mgmt/schemas/emp.schema';
import { ProfitLossTemplate, ProfitLossTemplateSchema } from './schemas/profit-loss-schema';
import { GlAccountModule } from 'src/gl-account/gl-account.module';
import { ProfitLossService } from './profit-loss.service';
import { ProfitLossController } from './profit-loss.controller';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProfitLossTemplate.name, schema: ProfitLossTemplateSchema },
            {
                name: GlVoucher.name,
                schema: GlVoucherSchema,
            },
            { name: GlAccountMapping.name, schema: GlAccountMappingSchema },
            { name: EmpTimeSheet.name, schema: EmpTimeSheetSchema },
            { name: Emp.name, schema: EmpSchema }
        ]),
        GlAccountModule
    ],
    controllers: [ProfitLossController],
    providers: [ProfitLossService],
    exports: [ProfitLossService],
})
export class ProfitLossModule { }
