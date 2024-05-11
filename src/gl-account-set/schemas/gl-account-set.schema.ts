import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type GlAccountSetDocument = GlAccountSet & Document;

@Schema({ timestamps: true })
export class GlAccountSet {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'GlAccount',
    index: true,
    required: true,
  })
  glAccountIds: GlAccountDocument[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  addedBy: UserDocument;
  
  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  nameAr: string;
}

export const GlAccountSetSchema = SchemaFactory.createForClass(GlAccountSet);
GlAccountSetSchema.plugin(paginate);
