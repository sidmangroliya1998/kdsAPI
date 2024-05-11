import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { UserDocument } from 'src/users/schemas/users.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { GLTransStatus, GlVoucherType } from '../enum/en.enum';

import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { GlVoucherItem, GlVoucherItemSchema } from './gl-voucher-item.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type GlVoucherDocument = GlVoucher & Document;

@Schema({ timestamps: true })
export class GlVoucher {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  })
  restaurantId: RestaurantDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PurchaseOrder',
    default: null,
  })
  purchaseOrderId: PurchaseOrderDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
  })
  vendorId: VendorDocument;

  @Prop({ default: null })
  vendorName: string;

  @Prop({ type: String, enum: GlVoucherType })
  type: GlVoucherType;

  @Prop({ required: true })
  voucherNumber: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ default: null })
  period: number;

  @Prop({ default: null })
  year: number;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  referenceNumber: string;


  @Prop({ default: null })
  referenceDocNumber: string;

  @Prop({ default: false })
  isReversed: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlVoucher',
    default: null,
  })
  reversedVoucherId: GlVoucherDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlVoucher',
    default: null,
  })
  reverseId: GlVoucherDocument;

  @Prop({ default: null })
  attachment: string;

  @Prop({ type: [GlVoucherItemSchema], required: true })
  items: GlVoucherItem[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  addedBy: UserDocument;

  @Prop({ type: String, enum: GLTransStatus, default: GLTransStatus.Approved })
  transStatus: GLTransStatus;
}
export const GlVoucherSchema = SchemaFactory.createForClass(GlVoucher);
GlVoucherSchema.plugin(paginate);
GlVoucherSchema.plugin(mongooseAggregatePaginate);