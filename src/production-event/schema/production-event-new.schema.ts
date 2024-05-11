import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    MaterialDocument,
} from 'src/material/schemas/material.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { UserDocument } from 'src/users/schemas/users.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { TransStatus } from 'src/core/Constants/enum';

export type ProductionEventNewDocument = ProductionEventNew & Document;

@Schema({ timestamps: true })
export class ProductionEventNewItem {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Material',
        index: true,
        required: true,
    })
    materialId: MaterialDocument;

    @Prop({ default: 1 })
    quantity: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'UnitOfMeasure',
        required: true,
    })
    uom: UnitOfMeasureDocument;

    @Prop({ default: 0 })
    cost: number;
}

const ProductionEventNewItemSchema = SchemaFactory.createForClass(ProductionEventNewItem);

@Schema({ timestamps: true })
export class ProductionEventNew {
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
        index: true,
        required: true,
    })
    restaurantId: RestaurantDocument;

    @Prop({ type: [ProductionEventNewItemSchema], default: [] })
    items: ProductionEventNewItem[];

    @Prop({ default: null })
    totalCost: number;

    @Prop({ default: false })
    isApplied: boolean;

    @Prop({ required: true, null: true })
    date: Date;

    @Prop({ default: false })
    trasferredToGl: boolean;

    @Prop({ default: null })
    transferredAt: Date;

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

    @Prop({ default: null })
    docNumber: string;

    @Prop({
        type: String,
        enum: TransStatus,
        default: TransStatus.Draft,
    })
    transType: string;
}

export const ProductionEventNewSchema =
    SchemaFactory.createForClass(ProductionEventNew);

ProductionEventNewSchema.plugin(paginate);
