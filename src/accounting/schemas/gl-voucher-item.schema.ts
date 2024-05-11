import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { GlLineType } from '../enum/en.enum';
import { ListDocument } from 'src/list/schemas/list.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { GlTaxIndicationDocument } from 'src/gl-tax-indication/schemas/gl-tax-indication.schema';

export type GlVoucherItemDocument = GlVoucherItem & Document;

@Schema({ timestamps: false })
export class GlVoucherItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    index: true,
    required: true,
    null: false,
  })
  glAccountId: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
    default: null,
  })
  partnerRestaurantId?: GlAccountDocument;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: GlLineType })
  glLineType: GlLineType;

  @Prop({ default: null })
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter?: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment?: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose?: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    required: false,
    default: null,
  })
  restaurantId?: RestaurantDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlTaxIndication',
    required: false,
  })
  glTaxIndicationId?: GlTaxIndicationDocument;
}

export const GlVoucherItemSchema = SchemaFactory.createForClass(GlVoucherItem);
GlVoucherItemSchema.plugin(paginate);
