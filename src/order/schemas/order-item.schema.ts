import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import {
  MenuItemDocument,
  PromotionalGroupedItem,
  PromotionalGroupedItemSchema,
} from 'src/menu/schemas/menu-item.schema';
import { MenuAdditionDocument } from 'src/menu/schemas/menu-addition.schema';
import { Alergies } from 'src/menu/enum/en.enum';
import { PreparationStatus } from '../enum/en.enum';
import { KitchenQueueDocument } from 'src/kitchen-queue/schemas/kitchen-queue.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { MenuCategoryDocument } from 'src/menu/schemas/menu-category.schema';

export type OrderItemDocument = OrderItem & Document;

@Schema({ _id: false })
export class OrderAdditionOption {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
  })
  optionId: ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ default: false })
  taxEnabled: boolean;

  @Prop({})
  calory: number;

  @Prop({ required: true })
  unitPriceBeforeDiscount: number;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 1 })
  perItemQuantity: number;

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

}
const OrderAdditionOptionSchema =
  SchemaFactory.createForClass(OrderAdditionOption);

@Schema({ _id: false })
export class OrderMenuAddition {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MenuAddition',
    required: true,
  })
  menuAdditionId: MenuAdditionDocument;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ type: [OrderAdditionOptionSchema] })
  options: OrderAdditionOption[];
}
export const OrderMenuAdditionSchema =
  SchemaFactory.createForClass(OrderMenuAddition);

@Schema({ _id: false })
export class OrderMenuItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  })
  menuItemId: MenuItemDocument;

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

  @Prop({ required: true })
  unitPriceBeforeDiscount: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    default: null,
  })
  uomSell: UnitOfMeasureDocument;

  // @Prop({ default: 1 })
  // quantity: number;

  @Prop({ default: 0 })
  feeRate: number;

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

  @Prop({ default: false })
  taxEnabled: boolean;

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

  @Prop({ default: 0 })
  preparationTime: number;

  @Prop({
    default: [],
    type: [PromotionalGroupedItemSchema],
  })
  promotionalGroupedItems?: [
    {
      item: OrderMenuItem;
      quantity: number;
      kitchenQueueId: KitchenQueueDocument;
    },
  ];
}
const MenuItemSchema = SchemaFactory.createForClass(OrderMenuItem);

@Schema({})
export class OrderItem {
  @Prop({ type: MenuItemSchema, required: true })
  menuItem: OrderMenuItem;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'KitchenQueue',
    default: null,
  })
  kitchenQueueId: KitchenQueueDocument;

  @Prop({ type: [OrderMenuAdditionSchema] })
  additions: OrderMenuAddition[];

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

  @Prop({ required: true })
  subTotal: number;

  @Prop({ required: false })
  totalFee: number;

  @Prop({ required: false })
  totalShishaSales: number;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: false })
  isGrouped?: boolean;

  @Prop({ default: null })
  promotionalItemId?: string;

  @Prop({ default: null })
  notes: string;

  @Prop({ default: 0 })
  preparationTime: number;

  @Prop({
    type: String,
    enum: PreparationStatus,
    default: PreparationStatus.NotStarted,
  })
  preparationStatus: PreparationStatus;

  @Prop({ required: false, default: null })
  couponCode: string;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
