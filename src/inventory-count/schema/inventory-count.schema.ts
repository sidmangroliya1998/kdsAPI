import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import { UserDocument } from 'src/users/schemas/users.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { RecipeDocument } from 'src/recipe/schema/recipe.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { InventoryCountStatus } from '../enum/en';
import * as paginate from 'mongoose-paginate-v2';
import { ListDocument } from 'src/list/schemas/list.schema';
import {
  InventoryCountItem,
  InventoryCountItemSchema,
} from './inventory-count-item.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';

export type InventoryCountDocument = InventoryCount & Document;

@Schema({ timestamps: true })
export class InventoryCount {
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

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  descriptionAr: string;

  @Prop({ type: [InventoryCountItemSchema], default: [] })
  items: InventoryCountItem[];

  @Prop({
    type: String,
    enum: InventoryCountStatus,
    default: InventoryCountStatus.New,
  })
  status: InventoryCountStatus;

  @Prop({ required: true, null: true })
  date: Date;

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
  docNumber: string;

  @Prop({ default: null })
  referenceNumber: string;

  @Prop({ default: null })
  attachment: string;

  @Prop({ required: false, null: true })
  statusDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'List',
    default: null,
    required: false
  })
  storage: ListDocument;
}

export const InventoryCountSchema =
  SchemaFactory.createForClass(InventoryCount);

InventoryCountSchema.plugin(paginate);
