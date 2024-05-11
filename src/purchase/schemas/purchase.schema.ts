import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import {
  Restaurant,
  RestaurantDocument,
} from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

import { PrinterDocument } from 'src/printer/schema/printer.schema';
import { auditLogPlugin } from 'src/log-payload/plugin/audit-log.plugin';
import { AutoCachePlugin } from 'src/cache/plugin/auto-cache.plugin';
import { PaymentMethod } from 'src/payment/enum/en.enum';

import {
  AdhocVendor,
  AdhocVendorSchema,
  Expense,
} from 'src/expense/schemas/expense.schema';
import {
  PurchaseLineItem,
  PurchaseLineItemSchema,
} from './purchase-line-item.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { TransStatus } from 'src/core/Constants/enum';

export type PurchaseDocument = Purchase & Document;

@Schema({ timestamps: true })
export class Purchase {
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
    ref: 'Vendor',
    index: true,
    required: false,
  })
  vendorId: VendorDocument;

  @Prop({ required: true })
  voucherNumber: number;

  @Prop({ default: null })
  referenceNumber: string;

  @Prop({ default: null })
  details: string;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.Cash })
  paymentType: PaymentMethod;

  @Prop({ default: null })
  receipt: string;

  @Prop({ type: [String], default: [] })
  otherDocs: string[];

  @Prop({ type: AdhocVendorSchema, default: null })
  adhocVendor: AdhocVendor;

  @Prop({ type: [PurchaseLineItemSchema], required: true })
  items: PurchaseLineItem[];

  @Prop({ type: Date })
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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: null
  })
  otherGLAccount: string;

  @Prop({ required: true })
  totalGrossAmount: number;

  @Prop({ required: true })
  totalNet: number;

  @Prop({ default: 0 })
  totalTax: number;

  @Prop({
    type: String,
    enum: TransStatus,
    default: TransStatus.Draft,
  })
  transType: string;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
PurchaseSchema.plugin(paginate);
