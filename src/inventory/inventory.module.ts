import { Module, forwardRef } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './schemas/inventory.schema';
import { InventoryHelperService } from './inventory-helper.service';
import { MenuItem, MenuItemSchema } from 'src/menu/schemas/menu-item.schema';
import { Material, MaterialSchema } from 'src/material/schemas/material.schema';
import { I18nModule } from 'nestjs-i18n';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import {
  InventoryHistory,
  InventoryHistorySchema,
} from './schemas/inventory-history.schema';
import { Recipe, RecipeSchema } from 'src/recipe/schema/recipe.schema';
import { RecipeModule } from 'src/recipe/recipe.module';
import {
  ProfitDetail,
  ProfitDetailSchema,
} from 'src/profit-detail/schema/profit-detail.schema';
import {
  RestaurantMaterial,
  RestaurantMaterialSchema,
} from 'src/material/schemas/restaurant-material.schema';
import { InventorySchedulerService } from './inventory-scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from 'src/notification/mail/mail.module';
import { GlobalConfigModule } from 'src/global-config/global-config.module';
import {
  Restaurant,
  RestaurantSchema,
} from 'src/restaurant/schemas/restaurant.schema';
import {
  LowInventory,
  LowInventorySchema,
} from './schemas/low-inventory.schema';
import {
  InventoryTransfer,
  InventoryTransferSchema,
} from './schemas/inventory-transfer.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { ItemConsumption, ItemConsumptionSchema } from './schemas/item-consumption.schema';
import { InventoryTransferRequest, InventoryTransferRequestSchema } from './schemas/inventory-transfer-req.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { InventoryTransferNew, InventoryTransferNewSchema } from './schemas/inventory-transfer-new.schema';
import { InvoiceReceipt, InvoiceReceiptSchema } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { InventoryControlData, InventoryControlDataSchema } from './schemas/inventory-control.schema';
import { ProductionEventNew, ProductionEventNewSchema } from 'src/production-event/schema/production-event-new.schema';
import { ItemConsumptionDetail, ItemConsumptionDetailSchema } from './schemas/item-consumption-detail.schema';
import { CostOfSalesDetail, CostOfSalesDetailSchema } from './schemas/cost-of-sales.schema';
import { MenuAddition, MenuAdditionSchema } from 'src/menu/schemas/menu-addition.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: InventoryHistory.name, schema: InventoryHistorySchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: ProfitDetail.name, schema: ProfitDetailSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: LowInventory.name, schema: LowInventorySchema },
      { name: InventoryTransfer.name, schema: InventoryTransferSchema },
      { name: ItemConsumption.name, schema: ItemConsumptionSchema },
      { name: ItemConsumptionDetail.name, schema: ItemConsumptionDetailSchema },
      { name: InventoryTransferRequest.name, schema: InventoryTransferRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: InventoryTransferNew.name, schema: InventoryTransferNewSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: InventoryControlData.name, schema: InventoryControlDataSchema },
      { name: ProductionEventNew.name, schema: ProductionEventNewSchema },
      { name: CostOfSalesDetail.name, schema: CostOfSalesDetailSchema },
      { name: MenuAddition.name, schema: MenuAdditionSchema },

    ]),
    forwardRef(() => UnitOfMeasureModule),
    RecipeModule,
    MailModule,
    GlobalConfigModule,
    AccountingModule,
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryHelperService,
    InventorySchedulerService,
  ],
  exports: [InventoryHelperService, InventoryService],
})
export class InventoryModule { }
