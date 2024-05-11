import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';

import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type GlTaxIndicationDocument = GlTaxIndication & Document;

@Schema({ timestamps: true })
export class GlTaxIndication {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: null })
    nameAr: string;

    @Prop({ required: true, default: 0 })
    rate: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;
}

export const GlTaxIndicationSchema =
    SchemaFactory.createForClass(GlTaxIndication);
GlTaxIndicationSchema.plugin(paginate);
