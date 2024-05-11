import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

import * as paginate from 'mongoose-paginate-v2';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { CustomerDocument } from 'src/customer/schemas/customer.schema';
import {
  ManualVendorInvoiceLineItem,
  ManualVendorInvoiceLineItemSchema,
} from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice-line-item.schema';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { DocTypes, TransStatus } from 'src/core/Constants/enum';

export type ManualCustomerInvoiceDocument = ManualCustomerInvoice & Document;

@Schema({ timestamps: true })
export class ManualCustomerInvoice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Customer',
    index: true,
    required: true,
  })
  customerId: CustomerDocument;

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
    default: null,
  })
  purchaseOrderId: PurchaseOrderDocument;

  @Prop({ required: true, null: true })
  date: Date;

  @Prop({ required: false })
  dueDate: Date;

  @Prop({ default: null })
  text: string;

  @Prop({ type: [ManualVendorInvoiceLineItemSchema], required: true })
  items: ManualVendorInvoiceLineItem[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
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
  attachment?: string;

  @Prop({ default: null })
  totalCost: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  netAmount: number;

  @Prop({ default: 0 })
  remainCost: number;

  @Prop({ default: 0 })
  totalPaid: number;
  
  @Prop({
    type: String,
    enum: OrderPaymentStatus,
    default: OrderPaymentStatus.NotPaid,
  })
  paymentStatus: OrderPaymentStatus;

  @Prop({ default: null })
  docNumber: string;

  @Prop({ default: null })
  referenceNumber?: string;

  @Prop({ default: false })
  isReturn: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'ManualCustomerInvoice',
    required: false,
  })
  referenceCI?: string;

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

  @Prop({ default: false })
  isIncludingPayment: boolean;
}

export const ManualCustomerInvoiceSchema = SchemaFactory.createForClass(
  ManualCustomerInvoice,
);
ManualCustomerInvoiceSchema.plugin(paginate);
