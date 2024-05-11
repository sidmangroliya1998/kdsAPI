
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { GlAssetCodeDocument } from 'src/gl-asset-code/schemas/create-gl-asset.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type AssetCategoryDocument = AssetCategory & Document;

@Schema({ timestamps: true })
export class AssetCategory {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAssetCode',
        required: true,
        index: true,
    })
    glAssetCodeId: GlAssetCodeDocument;

    @Prop({ required: true })
    name: string;

    @Prop({ required: false })
    nameAr: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

    @Prop({ default: null })
    deletedAt: Date;
}

export const AssetCategorySchema = SchemaFactory.createForClass(AssetCategory);
AssetCategorySchema.plugin(paginate);
