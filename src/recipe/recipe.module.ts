import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Recipe, RecipeSchema } from './schema/recipe.schema';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schemas/inventory.schema';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import { Material, MaterialSchema } from 'src/material/schemas/material.schema';
import {
  UnitOfMeasure,
  UnitOfMeasureSchema,
} from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { Restaurant, RestaurantSchema } from 'src/restaurant/schemas/restaurant.schema';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { RestaurantMaterial, RestaurantMaterialSchema } from 'src/material/schemas/restaurant-material.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recipe.name, schema: RecipeSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Material.name, schema: MaterialSchema },
      { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema }
    ]),
    UnitOfMeasureModule,
    RestaurantModule
  ],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
