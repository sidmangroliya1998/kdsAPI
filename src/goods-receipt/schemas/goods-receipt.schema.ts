import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { TransStatus } from 'src/core/Constants/enum';
import { TaxIndication } from 'src/expense/enum/en';

import {
  MaterialItemDocument,
  MaterialItemSchema,
} from 'src/purchase-order/schemas/material-item.schema';

import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type GoodsReceiptDocument = GoodsReceipt & Document;

@Schema({ timestamps: true })
export class GoodsReceipt {
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
    ref: 'PurchaseOrder',
    index: true,
    required: true,
  })
  purchaseOrderId: PurchaseOrderDocument;

  @Prop({ default: null })
  url: string;

  @Prop({ type: [MaterialItemSchema], required: true })
  items: MaterialItemDocument[];

  @Prop({ default: null })
  totalCost: number;

  @Prop({ default: null })
  tax: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ required: true, null: true })
  date: Date;

  @Prop({ default: null })
  deletedAt: Date;

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

  @Prop({ default: 0 })
  additionalCost: number;

  @Prop({ type: String, enum: TaxIndication })
  taxIndication: TaxIndication;

  @Prop({ default: false })
  isReturn: boolean;

  @Prop({
    type: String,
    enum: TransStatus,
    default: TransStatus.Draft,
  })
  transType: string;
  
  @Prop({ default: null })
  referenceNumber: string;

  @Prop({ default: [], type: [String] })
  attachment?: string[];
}

export const GoodsReceiptSchema = SchemaFactory.createForClass(GoodsReceipt);

GoodsReceiptSchema.plugin(paginate);
