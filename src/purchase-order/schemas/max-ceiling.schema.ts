
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';

export type MaxCeilingPriceDocument = MaxCeilingPrice & Document;

@Schema({})
export class MaxCeilingPrice {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Material',
        index: true,
        required: true,
    })
    materialId: MaterialDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Restaurant',
        index: true,
        required: true,
    })
    restaurantId: RestaurantDocument;

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
export const MaxCeilingPriceSchema = SchemaFactory.createForClass(MaxCeilingPrice);
