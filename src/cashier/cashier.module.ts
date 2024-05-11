import { Module } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CashierController } from './cashier.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cashier, CashierSchema } from './schemas/cashier.schema';
import { CashierLog, CashierLogSchema } from './schemas/cashier-log.schema';
import { CashierLogService } from './cashier-log.service';
import { CashierHelperService } from './cashier-helper.service';
import { SocketIoModule } from 'src/socket-io/socket-io.module';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import {
  DeferredTransaction,
  DeferredTransactionSchema,
} from 'src/order/schemas/deferred-transaction.schema';
import {
  Supplier,
  SupplierSchema,
} from 'src/supplier/schemas/suppliers.schema';
import { Invoice, InvoiceSchema } from 'src/invoice/schemas/invoice.schema';
import { TableLog, TableLogSchema } from 'src/table/schemas/table-log.schema';
import { Table, TableSchema } from 'src/table/schemas/table.schema';
import { TemplateResolverModule } from 'src/template-resolver/template-resolver.module';
import { Printer, PrinterSchema } from 'src/printer/schema/printer.schema';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import { NotificationModule } from 'src/notification/notification.module';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/schemas/transactions.schema';
import { EmpDebtService } from 'src/employee-mgmt/service/emp-debt.service';
import { EmpDebt, EmpDebtSchema } from 'src/employee-mgmt/schemas/emp-debt.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cashier.name, schema: CashierSchema },
      { name: CashierLog.name, schema: CashierLogSchema },
      { name: User.name, schema: UserSchema },
      { name: DeferredTransaction.name, schema: DeferredTransactionSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Table.name, schema: TableSchema },
      { name: Printer.name, schema: PrinterSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: EmpDebt.name, schema: EmpDebtSchema },
    ]),
    SocketIoModule,
    TemplateResolverModule,
    NotificationModule,
  ],
  controllers: [CashierController],
  providers: [CashierService, CashierLogService, CashierHelperService, EmpDebtService],
  exports: [CashierService, CashierLogService, CashierHelperService],
})
export class CashierModule { }
