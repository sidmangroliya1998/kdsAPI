import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { AssetAquDocument } from './asset-aqu.schema';

export type AssetAquDepLineItemDocument = AssetAquDepLineItem & Document;

@Schema({ timestamps: true })
export class AssetAquDepLineItem {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'AssetAqu',
        required: true,
        index: true,
    })
    assetAquId: AssetAquDocument;

    @Prop({ required: false })
    amount: number;

    @Prop({ required: false })
    monthNumber: number;

    @Prop({ required: false })
    yearNumber: number;
}


export const AssetAquDepLineItemSchema = SchemaFactory.createForClass(AssetAquDepLineItem);
