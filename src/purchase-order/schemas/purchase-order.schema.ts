import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { ListDocument } from 'src/list/schemas/list.schema';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import {
  MaterialItemDocument,
  MaterialItemSchema,
} from './material-item.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { PurchaseOrderStatus } from '../enum/en';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { TaxIndication } from 'src/expense/enum/en';
import { DocTypes, TransStatus } from 'src/core/Constants/enum';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema({ timestamps: true })
export class PurchaseOrder {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Vendor',
    index: true,
    required: true,
  })
  vendorId: VendorDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
    required: true,
  })
  restaurantId: RestaurantDocument;

  @Prop({ default: null })
  poNumber: number;

  @Prop({ default: null })
  url: string;

  @Prop({ type: [MaterialItemSchema], required: true })
  items: MaterialItemDocument[];

  @Prop({ default: null })
  totalCost: number;

  @Prop({ default: null })
  tax: number;

  @Prop({
    type: String,
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.New,
  })
  status: PurchaseOrderStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ required: true, null: true })
  date: Date;

  @Prop({ default: false })
  isSimplified: boolean;

  @Prop({
    type: String,
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Prop({ default: [], type: [String] })
  attachment?: string[];

  @Prop({ default: null })
  otherGLAccount: string;

  @Prop({ default: null })
  referenceNumber: string;

  @Prop({ default: 0 })
  additionalCost: number;

  @Prop({ type: String, enum: TaxIndication })
  taxIndication: TaxIndication;

  @Prop({ default: false })
  isReturn: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'PurchaseOrder',
    required: false,
  })
  referencePO?: string;

  @Prop({
    type: String,
    enum: DocTypes,
    default: DocTypes.Standard,
  })
  docType: string;

  @Prop({
    type: String,
    enum: TransStatus,
    default: TransStatus.Draft,
  })
  transType: string;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

PurchaseOrderSchema.plugin(paginate);
