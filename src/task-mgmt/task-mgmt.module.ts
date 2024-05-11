import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskManagementService } from './task-mgmt.service';
import { TaskManagement, TaskManagementSchema } from './schema/task-mgmt.schema';
import { TaskManagementController } from './task-mgmt.controller';
import { Expense, ExpenseSchema } from 'src/expense/schemas/expense.schema';
import { PurchaseOrder, PurchaseOrderSchema } from 'src/purchase-order/schemas/purchase-order.schema';
import { Purchase, PurchaseSchema } from 'src/purchase/schemas/purchase.schema';
import { PurchaseModule } from 'src/purchase/purchase.module';
import { PurchaseOrderModule } from 'src/purchase-order/purchase-order.module';
import { ExpenseModule } from 'src/expense/expense.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskManagement.name, schema: TaskManagementSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Expense.name, schema: ExpenseSchema },

    ]),
    PurchaseModule,
    PurchaseOrderModule,
    ExpenseModule
  ],
  controllers: [TaskManagementController],
  providers: [TaskManagementService],
})
export class TaskManagementModule {}
