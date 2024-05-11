import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { TaxIndication } from 'src/expense/enum/en';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

@Schema({ timestamps: false })
export class ManualVendorInvoiceLineItem {
  @Prop({ default: null })
  text: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    index: true,
    required: true,
    null: false,
  })
  expense: GlAccountDocument;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  net: number;

  @Prop({ type: String, enum: TaxIndication })
  taxIndication: TaxIndication;
}
export const ManualVendorInvoiceLineItemSchema = SchemaFactory.createForClass(
  ManualVendorInvoiceLineItem,
);
