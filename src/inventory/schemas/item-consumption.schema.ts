
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { OrderDocument } from 'src/order/schemas/order.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import * as paginate from 'mongoose-paginate-v2';

export type ItemConsumptionDocument = ItemConsumption & Document;

@Schema({ timestamps: true })
export class ItemConsumption {
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
        ref: 'Material',
        index: true,
        required: true,
    })
    materialId: MaterialDocument;

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

    @Prop({ default: 1 })
    quantitySold: number;

    @Prop({ default: 0 })
    conversionFactor: number;

    @Prop({ default: 0 })
    stock: number;

    @Prop({ default: 0 })
    stockValue: number;

    @Prop({ default: 0 })
    cost: number;

    @Prop({ default: 0 })
    averageCost: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'UnitOfMeasure',
        required: true,
    })
    uomBase: UnitOfMeasureDocument;

}

export const ItemConsumptionSchema =
    SchemaFactory.createForClass(ItemConsumption);

ItemConsumptionSchema.plugin(paginate);
