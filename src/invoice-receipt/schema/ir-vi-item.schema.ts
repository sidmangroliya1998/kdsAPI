import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';

export type IRVIItemDocument = IRVIItem & Document;

@Schema({})
export class IRVIItem {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Material',
        index: true,
        required: false
    })
    materialId: MaterialDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAccount',
        index: true,
        required: false
    })
    expense: GlAccountDocument;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    unitCost: number;

    @Prop({ default: 0 })
    tax: number;

    @Prop({ required: true })
    stock: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'UnitOfMeasure',
        index: true,
        default: null,
    })
    uom: UnitOfMeasureDocument;
}

export const IRVIItemSchema = SchemaFactory.createForClass(IRVIItem);
