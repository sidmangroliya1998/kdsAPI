import { Module } from '@nestjs/common';
import { TestDataService } from './test-data.service';
import { TestDataController } from './test-data.controller';

import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { TableModule } from 'src/table/table.module';
import { CashierModule } from 'src/cashier/cashier.module';
import { KitchenQueueModule } from 'src/kitchen-queue/kitchen-queue.module';
import { OrderModule } from 'src/order/order.module';
import { MenuModule } from 'src/menu/menu.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { PaymentModule } from 'src/payment/payment.module';
import { ListModule } from 'src/list/list.module';
import { PaymentSetupModule } from 'src/payment-setup/payment-setup.module';
import { UserModule } from 'src/users/users.module';
import { NotificationModule } from 'src/notification/notification.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from 'src/role/schemas/roles.schema';
import { MailModule } from 'src/notification/mail/mail.module';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { OfferModule } from 'src/offer/offer.module';
import { GlVendorCodeModule } from 'src/gl-vendor-code/gl-vendor-code.module';
import { GlMaterialCodeModule } from 'src/gl-material-code/gl-material-code.module';
import { PurchaseCategoryModule } from 'src/purchase-category/purchase-category.module';
import { RoleModule } from 'src/role/role.module';
import { ChartOfAccountModule } from 'src/chart-of-account/chart-of-account.module';
import { GlAccountGroupModule } from 'src/gl-account-group/gl-account-group.module';
import { GlAccountModule } from 'src/gl-account/gl-account.module';
import { GlAccountSetModule } from 'src/gl-account-set/gl-account-set.module';
import { GlAccountMappingModule } from 'src/gl-account-mapping/gl-account-mapping.module';
import { VendorModule } from 'src/vendor/vendor.module';
import { GlRevenueCodeModule } from 'src/gl-revenue-code/gl-revenue-code.module';
import { PrimeCostModule } from 'src/prime-cost-cal/prime-cost.module';
import { GlAssetCodeModule } from 'src/gl-asset-code/gl-asset-code.module';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import { ProfitLossModule } from 'src/profit-loss-cal/profit-loss.module';
import { BalanceSheetModule } from 'src/balance-sheet-cal/balance-sheet.module';


@Module({
  imports: [
    RestaurantModule,
    TableModule,
    CashierModule,
    KitchenQueueModule,
    OrderModule,
    MenuModule,
    InvoiceModule,
    PaymentModule,
    PaymentSetupModule,
    ListModule,
    UserModule,
    MailModule,
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    OfferModule,
    GlVendorCodeModule,
    GlMaterialCodeModule,
    PurchaseCategoryModule,
    RoleModule,
    ChartOfAccountModule,
    GlAccountGroupModule,
    GlAccountSetModule,
    GlAccountModule,
    GlAccountMappingModule,
    VendorModule,
    GlRevenueCodeModule,
    PrimeCostModule,
    GlAssetCodeModule,
    UnitOfMeasureModule,
    ProfitLossModule,
    BalanceSheetModule
  ],
  controllers: [TestDataController],
  providers: [TestDataService],
  exports: [TestDataService],
})
export class TestDataModule { }
