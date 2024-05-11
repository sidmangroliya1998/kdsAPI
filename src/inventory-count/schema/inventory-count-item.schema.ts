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
import { InventoryCountStatus, InventoryCountVariationStatus } from '../enum/en';
import * as paginate from 'mongoose-paginate-v2';
import { ListDocument } from 'src/list/schemas/list.schema';

@Schema({ _id: false })
export class ManualCount {
  @Prop({ required: true })
  quantity: number;

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
    default: null,
  })
  storage: ListDocument;

  @Prop({ required: false, default: 0 })
  baseQuantity: number;

  @Prop({ required: false, default: 0 })
  variationQuantity: number;

  @Prop({ required: false, type: String, enum: InventoryCountVariationStatus })
  variationStatus: number;
  
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    required: false,
  })
  uomBuy: UnitOfMeasureDocument;

  @Prop({ required: false })
  purchaseQty: number;

  @Prop({ required: false })
  variationQuantityPurchase: number;

}

export const ManualCountSchema = SchemaFactory.createForClass(ManualCount);

@Schema({ timestamps: true })
export class InventoryCountItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Material',
    index: true,
    required: true,
  })
  materialId: MaterialDocument;

  @Prop({ type: [ManualCountSchema], default: [] })
  count: ManualCount[];

  @Prop({ default: null })
  countValue: number;

  @Prop({ default: null })
  totalCount: number;

  @Prop({ default: null })
  onHandCount: number;

  @Prop({ default: null })
  onHandCountValue: number;

  @Prop({ default: null })
  onHandPurchaseCount: number;

  @Prop({ default: null })
  newPurchaseCount: number;

  @Prop({ default: null })
  onHandPurchaseValue: number;

  @Prop({ default: null })
  differentialCount: number;

  @Prop({ default: null })
  differentialCountValue: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    required: true,
  })
  uomBase: UnitOfMeasureDocument;

  @Prop()
  expirationDate: Date;

  @Prop({ required: false, default: 0 })
  variationQuantity: number;

  @Prop({ required: false, type: String, enum: InventoryCountVariationStatus })
  variationStatus: number;

  @Prop({ required: false, default: 0 })
  variationQuantityPurchase: number;
}

export const InventoryCountItemSchema =
  SchemaFactory.createForClass(InventoryCountItem);
