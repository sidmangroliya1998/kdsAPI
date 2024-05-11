import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

import { UserDocument } from 'src/users/schemas/users.schema';

import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { TaxIndication } from 'src/expense/enum/en';

export type ExpenseLineItemDocument = PurchaseLineItem & Document;

@Schema({ timestamps: true })
export class PurchaseLineItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    index: true,
    required: true,
  })
  category: GlAccountDocument;

  @Prop({ required: true })
  grossAmount: number;

  @Prop({ required: true })
  net: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ type: String, enum: TaxIndication })
  taxIndication: TaxIndication;

  @Prop({ default: null })
  note: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;
}

export const PurchaseLineItemSchema =
  SchemaFactory.createForClass(PurchaseLineItem);
PurchaseLineItemSchema.plugin(paginate);
