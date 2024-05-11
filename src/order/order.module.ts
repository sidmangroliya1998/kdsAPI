import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuItem, MenuItemSchema } from 'src/menu/schemas/menu-item.schema';
import {
  MenuAddition,
  MenuAdditionSchema,
} from 'src/menu/schemas/menu-addition.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { CalculationService } from './calculation.service';
import {
  Supplier,
  SupplierSchema,
} from 'src/supplier/schemas/suppliers.schema';
import { Table, TableSchema } from 'src/table/schemas/table.schema';
import { Offer, OfferSchema } from 'src/offer/schemas/offer.schema';
import { Activity, ActivitySchema } from 'src/activity/schemas/activity.schema';
import { TableLog, TableLogSchema } from 'src/table/schemas/table-log.schema';
import { Cart, CartSchema } from './schemas/cart.schema';
import { SocketIoModule } from 'src/socket-io/socket-io.module';
import {
  KitchenQueue,
  KitchenQueueSchema,
} from 'src/kitchen-queue/schemas/kitchen-queue.schema';
import { TableModule } from 'src/table/table.module';
import { HttpCallerModule } from 'src/core/Providers/http-caller/http-caller.module';
import { Customer, CustomerSchema } from 'src/customer/schemas/customer.schema';
import { OrderNotificationService } from './order-notification.service';
import { CustomerModule } from 'src/customer/customer.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { SmsModule } from 'src/core/Providers/Sms/sms.module';
import { MailModule } from 'src/notification/mail/mail.module';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/schemas/notification.schema';
import {
  TrackNotification,
  TrackNotificationSchema,
} from 'src/notification/schemas/track-notification.schema';
import { Invoice, InvoiceSchema } from 'src/invoice/schemas/invoice.schema';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryModule } from 'src/inventory/inventory.module';
import { NotificationModule } from 'src/notification/notification.module';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { Role, RoleSchema } from 'src/role/schemas/roles.schema';
import { Printer, PrinterSchema } from 'src/printer/schema/printer.schema';
import { Cashier, CashierSchema } from 'src/cashier/schemas/cashier.schema';
import {
  DeferredTransaction,
  DeferredTransactionSchema,
} from './schemas/deferred-transaction.schema';
import { CashierModule } from 'src/cashier/cashier.module';
import { PermissionModule } from 'src/permission/permission.module';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/schemas/transactions.schema';
import { CacheModule } from 'src/cache/cache.module';
import {
  MenuCategory,
  MenuCategorySchema,
} from 'src/menu/schemas/menu-category.schema';
import {
  CashierLog,
  CashierLogSchema,
} from 'src/cashier/schemas/cashier-log.schema';
import { Bundle, BundleSchema } from 'src/bundle/schemas/bundle.schema';
import { OrderHelperService } from './order-helper.service';
import { Batch, BatchSchema } from 'src/batch/schemas/batch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Table.name, schema: TableSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: MenuAddition.name, schema: MenuAdditionSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: TableLog.name, schema: TableLogSchema },
      { name: Cart.name, schema: CartSchema },
      { name: KitchenQueue.name, schema: KitchenQueueSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: TrackNotification.name, schema: TrackNotificationSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Printer.name, schema: PrinterSchema },
      { name: Cashier.name, schema: CashierSchema },
      { name: DeferredTransaction.name, schema: DeferredTransactionSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: MenuCategory.name, schema: MenuCategorySchema },
      { name: CashierLog.name, schema: CashierLogSchema },
      { name: Bundle.name, schema: BundleSchema },
      { name: Batch.name, schema: BatchSchema }
    ]),
    SocketIoModule,
    TableModule,
    HttpCallerModule,
    SmsModule,
    MailModule,
    CustomerModule,
    forwardRef(() => InvoiceModule),
    DeliveryModule,
    ScheduleModule.forRoot(),
    InventoryModule,
    NotificationModule,
    CashierModule,
    PermissionModule,
    CacheModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderHelperService,
    CalculationService,
    OrderNotificationService,
  ],
  exports: [
    OrderService,
    OrderHelperService,
    CalculationService,
    OrderNotificationService,
  ],
})
export class OrderModule { }
