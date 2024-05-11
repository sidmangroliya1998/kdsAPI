import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmpController } from './controller/emp.controller';
import { Emp, EmpSchema } from './schemas/emp.schema';
import { EmpService } from './service/emp.service';
import { EmpTimeSheetService } from './service/emphourlytimesheet.service';
import { EmpTimeSheet, EmpTimeSheetSchema } from './schemas/emp-hourly-timesheet.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { EmpMonthlySalary, EmpMonthlySalarySchema } from './schemas/emp-monthly-payroll.schema';
import { Sequence, SequenceSchema } from 'src/sequence/schemas/sequence.schema';
import { SequenceService } from 'src/sequence/sequence.service';
import { OrderModule } from 'src/order/order.module';
import { EmpMeal, EmpMealSchema } from './schemas/emp-meal-schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { EmpDebtModule } from './emp-debt.module';




@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Emp.name, schema: EmpSchema },
            { name: EmpTimeSheet.name, schema: EmpTimeSheetSchema },
            { name: EmpMonthlySalary.name, schema: EmpMonthlySalarySchema },
            { name: Sequence.name, schema: SequenceSchema },
            { name: EmpMeal.name, schema: EmpMealSchema },
            { name: User.name, schema: UserSchema },
        ]),
        AccountingModule,
        OrderModule,
        EmpDebtModule
    ],
    controllers: [EmpController],
    providers: [EmpService, EmpTimeSheetService, SequenceService],
    exports: [EmpService, EmpTimeSheetService]
})
export class EmpModule { }
