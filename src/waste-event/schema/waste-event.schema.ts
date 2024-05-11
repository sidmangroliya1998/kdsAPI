import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import { UserDocument } from 'src/users/schemas/users.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { RecipeDocument } from 'src/recipe/schema/recipe.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { ListDocument } from 'src/list/schemas/list.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';

export type WasteEventDocument = WasteEvent & Document;

@Schema({ timestamps: true })
export class WasteEvent {
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

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 0 })
  value: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    required: true,
  })
  uom: UnitOfMeasureDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'List',
    required: true,
  })
  reason: ListDocument;

  @Prop({ required: true, null: true })
  date: Date;

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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ default: null })
  docNumber: string;
}

export const WasteEventSchema = SchemaFactory.createForClass(WasteEvent);
WasteEventSchema.plugin(paginate);
