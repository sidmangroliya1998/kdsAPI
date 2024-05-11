

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { AssetAquDocument } from './asset-aqu.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';

export type AssetRetirementDocument = AssetRetirement & Document;

@Schema({ timestamps: true })
export class AssetRetirement {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'AssetAqu',
        required: true,
        index: true,
    })
    assetAquId: AssetAquDocument;

    @Prop({ required: false })
    description: string;

    @Prop({ required: false })
    descriptionAr: string;

    @Prop({ default: null })
    docNumber: string;

    @Prop({ type: Date })
    date: Date;

    @Prop({ required: false })
    aquisitionAmount: number;

    @Prop({ required: false })
    accumlatedAmount: number;

    @Prop({ required: false })
    nbvAmount: number;

    @Prop({ required: false })
    depreciationAmount: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

}

export const AssetRetirementSchema = SchemaFactory.createForClass(AssetRetirement);
AssetRetirementSchema.plugin(paginate);
