import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { TaxIndication } from 'src/expense/enum/en';
import { ManualCustomerPayment } from './manual-customer-payment.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { ManualCustomerInvoiceDocument } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';

export type ManualCustomerPaymentHistoryDocument = ManualCustomerPaymentHistory & Document;
@Schema({ timestamps: true })
export class ManualCustomerPaymentHistory {

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ManualCustomerInvoice',
        index: true,
        required: true,
    })
    invoiceId: ManualCustomerInvoiceDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ManualCustomerPayment',
        index: true,
        required: true,
    })
    paymentId: ManualCustomerPayment;

    @Prop({ default: null })
    netAmount: number;

    @Prop({ default: null })
    totalCost: number;

    @Prop({ default: null })
    tax: number;

    @Prop({ default: 0 })
    remainCost: number;

    @Prop({ default: null })
    paidAmount: number;

    @Prop({ required: true, null: true })
    date: Date;

    @Prop({
        type: String,
        enum: OrderPaymentStatus,
        default: OrderPaymentStatus.NotPaid,
    })
    paymentStatus: OrderPaymentStatus;

    @Prop({ default: null })
    docNumber: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        default: null,
        ref: 'GlAccount',
    })
    glAccountId?: string;

    @Prop({ default: false })
    isReturn?: boolean;
}
export const ManualCustomerPaymentHistorySchema = SchemaFactory.createForClass(ManualCustomerPaymentHistory);
