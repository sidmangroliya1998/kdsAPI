
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { AssetCategoryDocument } from 'src/asset-management/asset-categories/schemas/asset-cat.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type AssetAquDocument = AssetAqu & Document;

@Schema({ timestamps: true })
export class AssetAqu {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    })
    restaurantId: RestaurantDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'AssetCategory',
        required: true,
        index: true,
    })
    glAssetCategoryId: AssetCategoryDocument;

    @Prop({ required: true })
    name: string;

    @Prop({ required: false })
    nameAr: string;

    @Prop({ required: false })
    lifeSpanNo: number;

    @Prop({ required: false, default: null })
    aquisitionDate?: Date;

    @Prop({ required: false, default: null })
    depreciationDate?: Date;

    @Prop({ required: false, default: null })
    retirementDate?: Date;

    @Prop({ required: false, default: null })
    acquisitionValue?: number;

    @Prop({ required: false, default: 0 })
    totalNet: number;
  
    @Prop({ required: false, default: 0 })
    totalTax: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

    @Prop({ default: null })
    deletedAt: Date;

    @Prop({ required: false, default: false })
    isRetired: boolean;

    @Prop({ required: false, default: 0 })
    accumValue: number;

    @Prop({ required: false, default: 0 })
    nbvValue: number;

    @Prop({ required: false, default: 0 })
    depreciationValue: number;

    @Prop({ required: false, default: 0 })
    plannedDepreciationValue: number;

    @Prop({ required: false })
    sequenceNumber: string;
}

export const AssetAquSchema = SchemaFactory.createForClass(AssetAqu);
AssetAquSchema.plugin(paginate);
