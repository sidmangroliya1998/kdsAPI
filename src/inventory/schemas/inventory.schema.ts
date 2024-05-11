import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import {
  ManualCount,
  ManualCountSchema,
} from 'src/inventory-count/schema/inventory-count-item.schema';
import { ListDocument } from 'src/list/schemas/list.schema';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
    required: true,
  })
  restaurantId: RestaurantDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Material',
    index: true,
    required: true,
  })
  materialId: MaterialDocument;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    index: true,
    ref: 'UnitOfMeasure',
    required: true,
  })
  uomInventory: UnitOfMeasureDocument[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    required: true,
  })
  uomBase: UnitOfMeasureDocument;

  @Prop({
    type: [ManualCountSchema],
    default: [],
  })
  storage: ManualCount[];

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: 0 })
  virtualConsumption: number;

  @Prop({ default: 0 })
  stockValue: number;

  @Prop({ default: 0 })
  averageCost: number;

  @Prop()
  expirationDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ default: false })
  trasferredToGl: boolean;

  @Prop({ default: null })
  transferredAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    default: null,
    ref: 'GlVoucher',
  })
  glVoucherId: GlVoucherDocument;
 
  @Prop({ default: null })
  deletedAt: Date;
  
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

InventorySchema.plugin(paginate);
InventorySchema.plugin(mongooseAggregatePaginate);