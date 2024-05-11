import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import * as paginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type InventoryControlDataDocument = InventoryControlData & Document;


@Schema({ timestamps: true })
export class InventoryControlData {
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

    @Prop()
    date: Date;

    @Prop({ default: 0 })
    startingStock: number;

    @Prop({ default: 0 })
    startingAvgCost: number;

    @Prop({ default: 0 })
    startingStockValue: number;

    @Prop({ default: 0 })
    purchaseQuantity: number;

    @Prop({ default: 0 })
    purchaseValue: number;

    @Prop({ default: 0 })
    stockTransferInQty: number;

    @Prop({ default: 0 })
    stockTransferInValue: number;

    @Prop({ default: 0 })
    stockTransferOutQty: number;

    @Prop({ default: 0 })
    stockTransferOutValue: number;

    @Prop({ default: 0 })
    productionCostQty: number;

    @Prop({ default: 0 })
    productionCostValue: number;

    @Prop({ default: 0 }) //Latest Inventory Count
    invCount: number;

    @Prop({ default: 0 }) //Latest Inventory Count Value
    invCountValue: number;

    @Prop({ default: 0 })
    totalICQtyGain: number;

    @Prop({ default: 0 })
    totalICValueGain: number;

    @Prop({ default: 0 })
    totalICQtyLoss: number;

    @Prop({ default: 0 })
    totalICValueLoss: number;

    @Prop({ default: 0 }) //Above System
    totalICCountGain: number;

    @Prop({ default: 0 }) //Below System
    totalICCountLoss: number;

    @Prop({ default: 0 })
    vendorReturnQty: number;

    @Prop({ default: 0 })
    vendorReturnValue: number;

    @Prop({ default: 0 }) //Production Event
    productionConsumeQty: number;

    @Prop({ default: 0 }) //Production Event
    productionConsumeValue: number;

    @Prop({ default: 0 }) //Production Event Material
    productionMaterialConsumeQty: number;

    @Prop({ default: 0 }) //Production Event Material
    productionMaterialConsumeValue: number;

    @Prop({ default: 0 })
    wasteQty: number;

    @Prop({ default: 0 })
    wasteValue: number;

    @Prop({ default: 0 })
    salesConsumeQty: number;

    @Prop({ default: 0 })
    salesConsumeValue: number;

    @Prop({ default: 0 })
    totalInQty: number;

    @Prop({ default: 0 })
    totalInValue: number;

    @Prop({ default: 0 })
    totalOutQty: number;

    @Prop({ default: 0 })
    totalOutValue: number;

    @Prop({ default: 0 }) //Not using
    amountProductionWasteEvent: number;

    @Prop({ default: 0 }) //Not using
    qtyProductionWasteEvent: number;

    @Prop({ default: 0 })
    calculatedStockQty: number;

    @Prop({ default: 0 })
    calculatedStockValue: number;

    @Prop({ default: 0 })
    calculatedStockAvgCost: number;

    @Prop({ default: 0 }) //Latest Stock Quantity
    stockQtyInSystem: number;

    @Prop({ default: 0 }) //Latest Stock Value
    stockValueInSystem: number;

    @Prop({ default: 0 }) //Latest Stock Average Cost
    stockAvgCostInSystem: number;
}

export const InventoryControlDataSchema =
    SchemaFactory.createForClass(InventoryControlData);

InventoryControlDataSchema.plugin(paginate);
InventoryControlDataSchema.plugin(mongooseAggregatePaginate);