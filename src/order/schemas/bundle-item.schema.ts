import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import { BundleDocument } from 'src/bundle/schemas/bundle.schema';
import { PartialType, OmitType } from '@nestjs/swagger';
import {
  SubGroup,
  SubGroupDocument,
  SubGroupSchema,
} from 'src/bundle/schemas/sub-group.schema';
import {
  OrderMenuAddition,
  OrderMenuAdditionSchema,
  OrderMenuItem,
} from './order-item.schema';
import { KitchenQueueDocument } from 'src/kitchen-queue/schemas/kitchen-queue.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { MenuCategoryDocument } from 'src/menu/schemas/menu-category.schema';
import { Alergies } from 'src/menu/enum/en.enum';
import { PreparationStatus } from '../enum/en.enum';

export type BundleItemDocument = BundleItem & Document;

@Schema({ _id: false })
class BundleMenuItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  })
  menuItemId: MenuItemDocument;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MenuCategory',
    index: true,
    default: null,
  })
  categoryId?: MenuCategoryDocument;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  descriptionAr: string;

  @Prop({ default: null })
  priceInStar: number;

  @Prop({ default: null })
  starGain: number;

  @Prop({ default: null })
  calories: number;

  @Prop({ default: null })
  image: string;

  @Prop({ type: [String], enum: Alergies })
  alergies: Alergies[];

  @Prop({
    type: String,
    enum: PreparationStatus,
    default: PreparationStatus.NotStarted,
  })
  preparationStatus: PreparationStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'KitchenQueue',
    default: null,
  })
  kitchenQueueId: KitchenQueueDocument;

  @Prop({ default: 0 })
  feeRate: number;

  @Prop({ required: false })
  amountBeforeDiscount: number;

  @Prop({ required: false })
  unitPriceDiscount: number;

  @Prop({ required: false })
  discount: number;

  @Prop({ required: false })
  unitPriceAfterDiscount: number;

  @Prop({ required: false })
  amountAfterDiscount: number;

  @Prop({ required: false })
  itemTaxableAmount: number;

  @Prop({ required: false })
  tax: number;

  @Prop({ required: false })
  subTotal: number;

  @Prop({ required: false })
  totalFee: number;

  @Prop({ required: false })
  totalShishaSales: number;

  @Prop({ default: null })
  notes: string;

  @Prop({ type: [], required: false })
  additions?: any[];
}

const BundleMenuItemSchema = SchemaFactory.createForClass(BundleMenuItem);

@Schema({})
class BundleSubGroup {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'SubGroup',
    required: true,
  })
  bundleSubGroupId: SubGroupDocument;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({ default: false })
  additionPricingIncluded: boolean;

  @Prop({ default: null })
  maxAllowedQuantities: number;

  @Prop({ type: [OrderMenuAdditionSchema], default: [] })
  additions: OrderMenuAddition[];

  @Prop({ type: [BundleMenuItemSchema], required: true })
  items: BundleMenuItem[];
}
const BundleSubGroupSchema = SchemaFactory.createForClass(BundleSubGroup);

@Schema({})
export class BundleItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Bundle',
    required: true,
  })
  bundleId: BundleDocument;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  descriptionAr: string;

  @Prop({ default: null })
  image: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ type: [BundleSubGroupSchema], required: true })
  bundleSubGroups: BundleSubGroup[];

  @Prop({ required: true })
  unitPriceBeforeDiscount: number;

  @Prop({ required: true })
  amountBeforeDiscount: number;

  @Prop({ required: true })
  unitPriceDiscount: number;

  @Prop({ required: true })
  discount: number;

  @Prop({ required: true })
  unitPriceAfterDiscount: number;

  @Prop({ required: true })
  amountAfterDiscount: number;

  @Prop({ required: true })
  itemTaxableAmount: number;

  @Prop({ required: true })
  tax: number;

  @Prop({ required: false })
  subTotal: number;

  @Prop({ required: false })
  totalFee: number;

  @Prop({ required: false })
  totalShishaSales: number;

  @Prop({ default: null })
  notes: string;
}
export const BundleItemSchema = SchemaFactory.createForClass(BundleItem);
