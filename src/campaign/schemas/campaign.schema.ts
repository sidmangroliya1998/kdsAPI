import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  nameAr: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: null })
  media: string;

  @Prop({ type: [String], default: [] })
  phoneNumbers: string[];

  @Prop({ type: Date })
  scheduledAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: Date, default: null })
  processedAt: Date;

  @Prop({ default: 0 })
  processedRecords: number;

  @Prop({ default: 0 })
  failedRecords: number;

  @Prop({ default: 0 })
  successfullRecords: number;

  @Prop({ default: 0 })
  status: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.plugin(paginate);
