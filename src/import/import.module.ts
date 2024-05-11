import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { SupplierModule } from 'src/supplier/Supplier.module';
import { StorageModule } from 'src/core/Providers/Storage/storage.module';
import { UserModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Import, ImportSchema } from './schemas/import.schema';
import { Role, RoleSchema } from 'src/role/schemas/roles.schema';
import { ImportHelperService } from './import-helper.service';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { MenuModule } from 'src/menu/menu.module';
import { MenuItem, MenuItemSchema } from 'src/menu/schemas/menu-item.schema';
import { OrderModule } from 'src/order/order.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    StorageModule,
    SupplierModule,
    UserModule,
    RestaurantModule,
    MenuModule,
    MongooseModule.forFeature([
      { name: Import.name, schema: ImportSchema },
      { name: Role.name, schema: RoleSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
    OrderModule,
    PaymentModule,
  ],
  controllers: [ImportController],
  providers: [ImportService, ImportHelperService],
  exports: [ImportHelperService],
})
export class ImportModule {}
