import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { ObjectType } from '../enum/en';
export type SequenceDocument = Sequence & Document;

@Schema({ timestamps: true })
export class Sequence {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({ required: true })
    sequenceValue: string;

    @Prop({ required: true, type: String, enum: ObjectType })
    objectType: ObjectType;
}
export const SequenceSchema = SchemaFactory.createForClass(Sequence);
SequenceSchema.plugin(paginate);