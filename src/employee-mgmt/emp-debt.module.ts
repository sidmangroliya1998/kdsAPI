import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmpController } from './controller/emp.controller';
import { EmpDebtController } from './controller/emp-debt.controller';
import { Emp, EmpSchema } from './schemas/emp.schema';
import { EmpService } from './service/emp.service';
import { EmpDebtService } from './service/emp-debt.service';
import { EmpTimeSheetService } from './service/emphourlytimesheet.service';
import { EmpTimeSheet, EmpTimeSheetSchema } from './schemas/emp-hourly-timesheet.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { EmpTimeSheetItem, EmpTimeSheetItemData, EmpTimeSheetItemDataSchema, EmpTimeSheetItemSchema } from './schemas/emp-hourly-item.schema';
import { EmpMonthlySalary, EmpMonthlySalarySchema } from './schemas/emp-monthly-payroll.schema';
import { Sequence, SequenceSchema } from 'src/sequence/schemas/sequence.schema';
import { SequenceService } from 'src/sequence/sequence.service';
import { OrderModule } from 'src/order/order.module';
import { EmpMeal, EmpMealSchema } from './schemas/emp-meal-schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { EmpDebt, EmpDebtSchema } from './schemas/emp-debt.schema';




@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: EmpDebt.name, schema: EmpDebtSchema },
        ])
    ],
    controllers: [EmpDebtController],
    providers: [EmpDebtService],
    exports: [EmpDebtService]
})
export class EmpDebtModule { }
