import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

import { UserDocument } from 'src/users/schemas/users.schema';
import { BatchAction } from '../enum/en';

export type BatchDocument = Batch & Document;

@Schema({ timestamps: true })
export class Batch {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({ type: Object, default: {} })
  request: any;

  @Prop({ type: Object, default: {} })
  response: any;

  @Prop({ type: String, enum: BatchAction })
  action: BatchAction;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
  })
  addedBy: UserDocument;
}
export const BatchSchema = SchemaFactory.createForClass(Batch);
BatchSchema.plugin(paginate);
