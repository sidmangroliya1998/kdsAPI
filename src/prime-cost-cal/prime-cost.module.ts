import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CogsGroup, CogsGroupSchema, LaborGroup, LaborGroupSchema, PrimeCostTemplate, PrimeCostTemplateSchema, SalesGroup, SalesGroupSchema } from './schema/prime-cost-template.schema';
import { PrimeCostService } from './prime-cost.service';
import { GlAccountModule } from 'src/gl-account/gl-account.module';
import { PrimeCostController } from './prime-cost.controller';
import { GlVoucher, GlVoucherSchema } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountMapping, GlAccountMappingSchema } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { EmpTimeSheet, EmpTimeSheetSchema } from 'src/employee-mgmt/schemas/emp-hourly-timesheet.schema';
import { Emp, EmpSchema } from 'src/employee-mgmt/schemas/emp.schema';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PrimeCostTemplate.name, schema: PrimeCostTemplateSchema },
            {
                name: GlVoucher.name,
                schema: GlVoucherSchema,
            },
            { name: GlAccountMapping.name, schema: GlAccountMappingSchema },
            { name: EmpTimeSheet.name, schema: EmpTimeSheetSchema },
            { name: Emp.name, schema: EmpSchema }
            // { name: LaborGroup.name, schema: LaborGroupSchema },
            // { name: CogsGroup.name, schema: CogsGroupSchema },
            // { name: SalesGroup.name, schema: SalesGroupSchema }
        ]),
        GlAccountModule
    ],
    controllers: [PrimeCostController],
    providers: [PrimeCostService],
    exports: [PrimeCostService],
})
export class PrimeCostModule { }
