

import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { OrderDocument } from 'src/order/schemas/order.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type CostOfSalesDetailDocument = CostOfSalesDetail & Document;

@Schema({ timestamps: true })
export class CostOfSalesDetail {

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

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Order',
        index: true,
        required: true,
    })
    orderId: OrderDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'MenuItem',
        index: true,
        required: true,
    })
    menuItemId: MenuItemDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Material',
        index: true,
        required: true,
    })
    materialId: MaterialDocument;

    @Prop({ default: 1 })
    quantitySold: number;

    @Prop({ default: 0 })
    sellingPrice: number;

    @Prop({ default: 0 })
    unitsellingPrice: number;

    @Prop({ default: 0 })
    cost: number;

    @Prop({ default: 0 })
    costperunit: number;
}
export const CostOfSalesDetailSchema =
    SchemaFactory.createForClass(CostOfSalesDetail);

CostOfSalesDetailSchema.plugin(paginate);
CostOfSalesDetailSchema.plugin(mongooseAggregatePaginate);