import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Material, MaterialSchema } from './schemas/material.schema';
import {
  RestaurantMaterial,
  RestaurantMaterialSchema,
} from './schemas/restaurant-material.schema';
import { UnitOfMeasure, UnitOfMeasureSchema } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { InventoryHistory, InventoryHistorySchema } from 'src/inventory/schemas/inventory-history.schema';
import { Inventory, InventorySchema } from 'src/inventory/schemas/inventory.schema';
import { Recipe, RecipeSchema } from 'src/recipe/schema/recipe.schema';
import { Sequence, SequenceSchema } from 'src/sequence/schemas/sequence.schema';
import { SequenceService } from 'src/sequence/sequence.service';
import { RecipeModule } from 'src/recipe/recipe.module';
import { Restaurant, RestaurantSchema } from 'src/restaurant/schemas/restaurant.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema },
      { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryHistory.name, schema: InventoryHistorySchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: Sequence.name, schema: SequenceSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: User.name, schema: UserSchema },

    ]),
    RecipeModule
  ],
  controllers: [MaterialController],
  providers: [MaterialService, SequenceService],
})
export class MaterialModule { }
