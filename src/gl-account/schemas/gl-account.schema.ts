import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { AdminDocument } from 'src/admin/schemas/admin.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

export type GlAccountDocument = GlAccount & Document;

@Schema({ timestamps: true })
export class GlAccount {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
    null: true,
  })
  glAccountGroupId: GlAccountDocument;

  @Prop({ required: true })
  glNumber: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({ default: false })
  isApplicableForPayment : boolean

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Admin',
    index: true,
  })
  addedBy: AdminDocument;
}

export const GlAccountSchema = SchemaFactory.createForClass(GlAccount);
GlAccountSchema.plugin(paginate);
