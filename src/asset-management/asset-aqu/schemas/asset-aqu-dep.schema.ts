
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { AssetAquDepLineItemDocument, AssetAquDepLineItemSchema } from './asset-aqu-dep-lineitem.schema';

export type AssetAquDepDocument = AssetAquDep & Document;

@Schema({ timestamps: true })
export class AssetAquDep {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({ required: false })
    description: string;

    @Prop({ required: false })
    descriptionAr: string;

    @Prop({ type: Date })
    date: Date;
    
    @Prop({ required: false })
    monthNumber: number;

    @Prop({ required: false })
    yearNumber: number;

    @Prop({ type: [AssetAquDepLineItemSchema], required: true })
    items: AssetAquDepLineItemDocument[];

    @Prop({ required: false })
    totalAmount: number;

    @Prop({ default: null })
    docNumber: string;

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

export const AssetAquDepSchema = SchemaFactory.createForClass(AssetAquDep);
AssetAquDepSchema.plugin(paginate);
