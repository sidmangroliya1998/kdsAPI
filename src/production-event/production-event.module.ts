import { Module } from '@nestjs/common';
import { ProductionEventService } from './production-event.service';
import { ProductionEventController } from './production-event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductionEvent,
  ProductionEventSchema,
} from './schema/production-event.schema';
import { ProductionEventHelperService } from './production-event-helper.service';
import { InventoryModule } from 'src/inventory/inventory.module';
import { Recipe, RecipeSchema } from 'src/recipe/schema/recipe.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { RecipeService } from 'src/recipe/recipe.service';
import { Inventory, InventorySchema } from 'src/inventory/schemas/inventory.schema';
import { Material, MaterialSchema } from 'src/material/schemas/material.schema';
import { UnitOfMeasure, UnitOfMeasureSchema } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { UnitOfMeasureService } from 'src/unit-of-measure/unit-of-measure.service';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { RestaurantMaterial, RestaurantMaterialSchema } from 'src/material/schemas/restaurant-material.schema';
import { ProductionEventNew, ProductionEventNewSchema } from './schema/production-event-new.schema';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { Restaurant, RestaurantSchema } from 'src/restaurant/schemas/restaurant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductionEvent.name, schema: ProductionEventSchema },
      { name: ProductionEventNew.name, schema: ProductionEventNewSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Material.name, schema: MaterialSchema },
      { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema },
      { name: User.name, schema: UserSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    InventoryModule,
    AccountingModule,
    RestaurantModule
  ],
  controllers: [ProductionEventController],
  providers: [ProductionEventService, ProductionEventHelperService,
    RecipeService, UnitOfMeasureService, UnitOfMeasureHelperService],
  exports: [ProductionEventService]
})
export class ProductionEventModule { }
