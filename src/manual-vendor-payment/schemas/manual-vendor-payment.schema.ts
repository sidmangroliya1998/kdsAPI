import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

import * as paginate from 'mongoose-paginate-v2';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { ManualVendorInvoiceDocument } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { RefInvoiceType } from 'src/manual-customer-payment/enum/en.enum';
import { ManualVendorPaymentHistory, ManualVendorPaymentHistorySchema } from './manual-vendor-payment-history.schema';
import { TransStatus } from 'src/core/Constants/enum';
import { PaymentMethod } from 'src/payment/enum/en.enum';

export type ManualVendorPaymentDocument = ManualVendorPayment & Document;


@Schema({ _id: false })
class RefInvoice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ManualVendorInvoice',
    index: true,
    required: true,
  })
  invoiceId: ManualVendorInvoiceDocument;

  @Prop({ type: String, enum: RefInvoiceType })
  type: RefInvoiceType;
}

const RefInvoiceSchema = SchemaFactory.createForClass(RefInvoice);

@Schema({ timestamps: true })
export class ManualVendorPayment {
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

  @Prop({ type: [RefInvoiceSchema], required: true })
  invoices: RefInvoice[];

  @Prop({ required: true, null: true })
  date: Date;

  @Prop({ default: null })
  text: string;

  @Prop({ default: null })
  payFrom: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: [String], required: true })
  items: string[];

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
  docNumber: string;

  @Prop({ default: null })
  attachment?: string;

  @Prop({ default: null })
  referenceNumber?: string;

  @Prop({ default: false })
  isReturn: boolean;

  @Prop({ type: [ManualVendorPaymentHistorySchema], required: false })
  history: ManualVendorPaymentHistory[];

  @Prop({
    type: String,
    enum: TransStatus,
    default: TransStatus.Draft,
  })
  transType: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: null
  })
  otherGLAccount: string;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.Cash })
  paymentType: PaymentMethod;
}

export const ManualVendorPaymentSchema =
  SchemaFactory.createForClass(ManualVendorPayment);
ManualVendorPaymentSchema.plugin(paginate);
