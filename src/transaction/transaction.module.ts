import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionSchema } from './schemas/transactions.schema';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import { OrderModule } from 'src/order/order.module';
import { TableLog, TableLogSchema } from 'src/table/schemas/table-log.schema';
import { CashierModule } from 'src/cashier/cashier.module';
import { SocketIoModule } from 'src/socket-io/socket-io.module';
import { TableModule } from 'src/table/table.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { ProfitDetailModule } from 'src/profit-detail/profit-detail.module';
import { AccountingModule } from 'src/accounting/accounting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: TableLog.name, schema: TableLogSchema },
    ]),
    OrderModule,
    CashierModule,
    TableModule,
    InvoiceModule,
    DeliveryModule,
    ProfitDetailModule,
    AccountingModule,
  ],
  providers: [TransactionService],
  exports: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
