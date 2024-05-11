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
import { ExpenseDocument } from './expense.schema';
import { TaxIndication } from '../enum/en';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

export type ExpenseLineItemDocument = ExpenseLineItem & Document;

@Schema({ timestamps: true })
export class ExpenseLineItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    index: true,
    required: true,
  })
  purpose: GlAccountDocument;

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

export const ExpenseLineItemSchema =
  SchemaFactory.createForClass(ExpenseLineItem);
ExpenseLineItemSchema.plugin(paginate);
