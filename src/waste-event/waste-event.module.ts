import { Module } from '@nestjs/common';
import { WasteEventService } from './waste-event.service';
import { WasteEventController } from './waste-event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { WasteEvent, WasteEventSchema } from './schema/waste-event.schema';
import { InventoryModule } from 'src/inventory/inventory.module';
import { AccountingModule } from 'src/accounting/accounting.module';
import { RestaurantMaterial, RestaurantMaterialSchema } from 'src/material/schemas/restaurant-material.schema';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import { WasteEventNew, WasteEventNewSchema } from './schema/waste-event-new.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WasteEvent.name, schema: WasteEventSchema },
      { name: WasteEventNew.name, schema: WasteEventNewSchema },
      { name: User.name, schema: UserSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema }
    ]),
    InventoryModule,
    AccountingModule,
    UnitOfMeasureModule
  ],
  controllers: [WasteEventController],
  providers: [WasteEventService],
  exports: [WasteEventService]
})
export class WasteEventModule { }
