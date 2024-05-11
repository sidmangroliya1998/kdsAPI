import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as BaseCacheModule } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';

import appConfigurations from './config/app.configuration';
import mongoConfiguration from './config/mongo.configuration';
import awsConfiguration from './config/aws.configuration';
import arbPgConfiguration from './config/arb-pg.configuration';
import mailConfiguration from './config/mail.configuration';
import clickPayConfiguration from './config/clickpay.configuration';
import pushNotificationConfiguration from './config/push-notification.configuration';
import feedusConfiguration from './config/feed-us.configuration';
import { UserModule } from './users/users.module';
import { SupplierModule } from './supplier/Supplier.module';
import { RoleModule } from './role/role.module';
import { EnumModule } from './enum/enum.module';
import { TransactionModule } from './transaction/transaction.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionGuard } from './permission/permission.guard';

import { AuthModule } from './auth/auth.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { TableModule } from './table/table.module';
import { PermissionModule } from './permission/permission.module';
import { MenuModule } from './menu/menu.module';
import { QrCodeModule } from './qr-code/qr-code.module';
import { KitchenQueueModule } from './kitchen-queue/kitchen-queue.module';
import { CashierModule } from './cashier/cashier.module';
import { ClientCommentModule } from './client-comment/client-comment.module';
import { ClientFeedbackModule } from './client-feedback/client-feedback.module';

import { SeedModule } from './seed/seed.module';
import { PaymentSetupModule } from './payment-setup/payment-setup.module';
import { FileUploaderModule } from './file-uploader/file-uploader.module';
import { ListModule } from './list/list.module';
import { ActivityModule } from './activity/activity.module';
import { WaitingQueueModule } from './waiting-queue/waiting-queue.module';
import { ReservationModule } from './reservation/reservation.module';
import { OrderModule } from './order/order.module';
import { OfferModule } from './offer/offer.module';
import { PaymentModule } from './payment/payment.module';
import { PuppeteerModule } from 'nest-puppeteer';
import { InvoiceModule } from './invoice/invoice.module';
import { CustomerModule } from './customer/customer.module';
import { ScreenDisplayModule } from './screen-display/screen-display.module';
import { FeatureModule } from './feature/feature.module';
import { PackageModule } from './package/package.module';
import { SocketIoModule } from './socket-io/socket-io.module';
import { ReportModule } from './reports/report.module';
import { ImportModule } from './import/import.module';

import { GlobalConfigModule } from './global-config/global-config.module';
import { TestDataModule } from './test-data/test-data.module';
import { AdminModule } from './admin/admin.module';
import { DeliveryModule } from './delivery/delivery.module';
import taqnyatSmsConfiguration from './config/taqnyat-sms.configuration';
import yallowDeliveryConfiguration from './config/yallow-delivery.configuration';
import { NotificationModule } from './notification/notification.module';
import { GooglePlacesModule } from './google-places/google-places.module';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
  HeaderResolver,
} from 'nestjs-i18n';
import { AllExceptionsFilter } from './core/Filters/all-exception.filter';
import { VendorModule } from './vendor/vendor.module';
import { MaterialModule } from './material/material.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { UnitOfMeasureModule } from './unit-of-measure/unit-of-measure.module';
import { GoodsReceiptModule } from './goods-receipt/goods-receipt.module';
import { RecipeModule } from './recipe/recipe.module';
import { ProductionEventModule } from './production-event/production-event.module';
import { WasteEventModule } from './waste-event/waste-event.module';
import { InventoryCountModule } from './inventory-count/inventory-count.module';
import { ProfitDetailModule } from './profit-detail/profit-detail.module';
import { InvoiceReceiptModule } from './invoice-receipt/invoice-receipt.module';
import { SelectedVendorModule } from './selected-vendor/selected-vendor.module';
import { VendorMaterialModule } from './vendor-material/vendor-material.module';
import { PaymentGatewayModule } from './payment-gateway/payment-gateway.module';
import { CustomerConditionModule } from './customer-condition/customer-condition.module';
import { InventoryReportModule } from './inventory-report/inventory-report.module';
import { CostSimulatorModule } from './cost-simulator/cost-simulator.module';
import { PrinterModule } from './printer/printer.module';
import { PublishModule } from './publish/publish.module';
import { DriverModule } from './driver/driver.module';
import { LogPayloadModule } from './log-payload/log-payload.module';
import { SmsProviderModule } from './sms-provider/sms-provider.module';
import { CacheModule } from './cache/cache.module';
import { MarketPlaceModule } from './market-place/market-place.module';
import { TemplateResolverModule } from './template-resolver/template-resolver.module';
import { ExpenseModule } from './expense/expense.module';
import { GlAccountModule } from './gl-account/gl-account.module';
import { CampaignModule } from './campaign/campaign.module';
import { AccountingModule } from './accounting/accounting.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PurchaseCategoryModule } from './purchase-category/purchase-category.module';
import { GlAccountMappingModule } from './gl-account-mapping/gl-account-mapping.module';
import { GlAccountGroupModule } from './gl-account-group/gl-account-group.module';
import { GlMaterialCodeModule } from './gl-material-code/gl-material-code.module';
import { GlVendorCodeModule } from './gl-vendor-code/gl-vendor-code.module';
import { AccountingReportTemplateModule } from './accounting-report-template/accounting-report-template.module';
import { GlAccountSetModule } from './gl-account-set/gl-account-set.module';
import { ManualVendorInvoiceModule } from './manual-vendor-invoice/manual-vendor-invoice.module';
import { ManualVendorPaymentModule } from './manual-vendor-payment/manual-vendor-payment.module';
import { ManualCustomerInvoiceModule } from './manual-customer-invoice/manual-customer-invoice.module';
import { ManualCustomerPaymentModule } from './manual-customer-payment/manual-customer-payment.module';
import { BatchModule } from './batch/batch.module';
import { BundleModule } from './bundle/bundle.module';
import { TrainingModule } from './training/training.module';
import { ChartOfAccountModule } from './chart-of-account/chart-of-account.module';
import { GlRevenueCodeModule } from './gl-revenue-code/gl-revenue-code.module';
import { EmpModule } from './employee-mgmt/emp.module';
import { OpeningBalModule } from './opening-bal/opening-bal.module';
import { PrimeCostModule } from './prime-cost-cal/prime-cost.module';
import { GlAssetCodeModule } from './gl-asset-code/gl-asset-code.module';
import { AssetAquModule } from './asset-management/asset-aqu/asset-aqu.module';
import { AssetCategoryModule } from './asset-management/asset-categories/asset-cat.module';
import { ProfitLossModule } from './profit-loss-cal/profit-loss.module';
import { BalanceSheetModule } from './balance-sheet-cal/balance-sheet.module';
import { NewClientModule } from './new-client-mgmt/new-client.module';
import { GlTaxIndicationModule } from './gl-tax-indication/gl-tax-indication.module';
import { TranslateEditorModule } from './translateEditor/transalteEditor.module';
import { TaskManagementModule } from './task-mgmt/task-mgmt.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfigurations,
        mongoConfiguration,
        awsConfiguration,
        arbPgConfiguration,
        mailConfiguration,
        //asmscSmsConfiguration,
        taqnyatSmsConfiguration,
        yallowDeliveryConfiguration,
        pushNotificationConfiguration,
        clickPayConfiguration,
        feedusConfiguration,
      ],
    }),
    MongooseModule.forRootAsync({
      //imports: [GlobalConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('mongo.dbUrl'), // Loaded from .ENV
      }),
    }),
    PuppeteerModule.forRoot({
      isGlobal: true,
      executablePath: process.env.CHROME_PATH,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/../test1/'),
        watch: true,
      },
      resolvers: [
        { use: HeaderResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    AuthModule,
    UserModule,
    SupplierModule,
    PermissionModule,
    RoleModule,
    EnumModule,
    TransactionModule,
    RestaurantModule,
    TableModule,
    MenuModule,
    KitchenQueueModule,
    QrCodeModule,
    CashierModule,
    ClientCommentModule,
    ClientFeedbackModule,
    PaymentSetupModule,

    SeedModule,
    FileUploaderModule,
    ListModule,
    ActivityModule,
    WaitingQueueModule,
    ReservationModule,
    OrderModule,
    OfferModule,
    PaymentModule,
    InvoiceModule,
    CustomerModule,
    ScreenDisplayModule,
    FeatureModule,
    PackageModule,
    ReportModule,
    SocketIoModule,
    ImportModule,
    PrinterModule,
    GlobalConfigModule,
    TestDataModule,
    AdminModule,
    DeliveryModule,
    NotificationModule,
    GooglePlacesModule,
    // VendorModule,
    MaterialModule,

    InventoryModule,
    PurchaseOrderModule,
    GoodsReceiptModule,
    UnitOfMeasureModule,
    RecipeModule,
    ProductionEventModule,
    WasteEventModule,
    InventoryCountModule,
    ProfitDetailModule,
    InvoiceReceiptModule,
    SelectedVendorModule,
    VendorMaterialModule,
    PaymentGatewayModule,
    CustomerConditionModule,
    InventoryReportModule,
    CostSimulatorModule,
    PublishModule,
    DriverModule,
    LogPayloadModule,
    SmsProviderModule,
    CacheModule,
    MarketPlaceModule,
    TemplateResolverModule,
    ExpenseModule,
    GlAccountModule,
    CampaignModule,
    AccountingModule,
    VendorModule,
    PurchaseModule,
    PurchaseCategoryModule,
    GlAccountMappingModule,
    GlAccountGroupModule,
    GlMaterialCodeModule,
    GlVendorCodeModule,
    AccountingReportTemplateModule,
    GlAccountSetModule,
    ManualVendorInvoiceModule,
    ManualVendorPaymentModule,
    ManualCustomerInvoiceModule,
    ManualCustomerPaymentModule,
    BatchModule,
    BundleModule,
    TrainingModule,
    ChartOfAccountModule,
    GlRevenueCodeModule,
    EmpModule,
    OpeningBalModule,
    PrimeCostModule,
    GlAssetCodeModule,
    AssetAquModule,
    AssetCategoryModule,
    ProfitLossModule,
    BalanceSheetModule,
    NewClientModule,
    GlTaxIndicationModule,
    TranslateEditorModule,
    TaskManagementModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    { provide: APP_GUARD, useClass: PermissionGuard },
    Logger,
    // {
    //   provide: APP_FILTER,
    //   useClass: AllExceptionsFilter,
    // },
  ],
})
export class AppModule { }
