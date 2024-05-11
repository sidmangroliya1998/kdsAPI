import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ManualVendorPayment } from './manual-vendor-payment.schema';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { TaxIndication } from 'src/expense/enum/en';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { ManualVendorInvoiceDocument } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';


@Schema({ timestamps: true })
export class ManualVendorPaymentHistory {

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ManualVendorInvoice',
    index: true,
    required: true,
  })
  invoiceId: ManualVendorInvoiceDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ManualVendorPayment',
    index: true,
    required: true,
  })
  paymentId: ManualVendorPayment;

  @Prop({ default: null })
  netAmount: number;

  @Prop({ default: null })
  totalCost: number;

  @Prop({ default: null })
  tax: number;

  @Prop({ default: 0 })
  remainCost: number;

  @Prop({ required: true, null: true })
  date: Date;

  @Prop({ default: null })
  paidAmount: number;

  @Prop({
    type: String,
    enum: OrderPaymentStatus,
    default: OrderPaymentStatus.NotPaid,
  })
  paymentStatus: OrderPaymentStatus;

  @Prop({ type: String, enum: TaxIndication })
  taxIndication: TaxIndication;

  @Prop({ default: null })
  docNumber: string;
}
export const ManualVendorPaymentHistorySchema = SchemaFactory.createForClass(ManualVendorPaymentHistory);
