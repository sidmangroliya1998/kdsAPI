import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import {
  ManualVendorInvoiceLineItem,
  ManualVendorInvoiceLineItemSchema,
} from './manual-vendor-invoice-line-item.schema';
import * as paginate from 'mongoose-paginate-v2';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { DocTypes, TransStatus } from 'src/core/Constants/enum';

export type ManualVendorInvoiceDocument = ManualVendorInvoice & Document;

@Schema({ timestamps: true })
export class ManualVendorInvoice {
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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PurchaseOrder',
    index: true,
    default: null,
  })
  purchaseOrderId: PurchaseOrderDocument;

  @Prop({})
  invoiceNumber: number;

  @Prop({ required: true, null: true })
  date: Date;

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

  @Prop({})
  amount: number;

  @Prop({})
  tax: number;

  @Prop({ default: null })
  totalCost: number;
  
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
  attachment?: string;

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
  referenceNumber?: string;

  @Prop({ default: false })
  isReturn: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'ManualVendorInvoice',
    required: false,
  })
  referenceVI?: string;

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

export const ManualVendorInvoiceSchema =
  SchemaFactory.createForClass(ManualVendorInvoice);
ManualVendorInvoiceSchema.plugin(paginate);
