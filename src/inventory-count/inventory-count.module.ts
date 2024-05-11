import { Module } from '@nestjs/common';
import { InventoryCountService } from './inventory-count.service';
import { InventoryCountController } from './inventory-count.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schemas/inventory.schema';
import {
  InventoryCount,
  InventoryCountSchema,
} from './schema/inventory-count.schema';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { InventoryCountHelperService } from './inventory-count-helper.service';
import { Material, MaterialSchema } from 'src/material/schemas/material.schema';
import { RestaurantMaterial, RestaurantMaterialSchema } from 'src/material/schemas/restaurant-material.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryCount.name, schema: InventoryCountSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: User.name, schema: UserSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema },
    ]),
    UnitOfMeasureModule,
    InventoryModule,
  ],
  controllers: [InventoryCountController],
  providers: [InventoryCountService, InventoryCountHelperService],
})
export class InventoryCountModule { }
