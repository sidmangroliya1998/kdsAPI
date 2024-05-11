import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { TaxIndication } from 'src/expense/enum/en';
import { OrderPaymentStatus } from 'src/order/enum/en.enum';
import { PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { IRVIType } from '../enum/en';
import { IRVIItem, IRVIItemSchema } from './ir-vi-item.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type IRVIDocument = IRVI & Document;

@Schema({ timestamps: true })
export class IRVI {
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
        ref: 'PurchaseOrder',
        index: true,
    })
    purchaseOrderId: PurchaseOrderDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Vendor',
        index: true,
        required: false,
    })
    vendorId: VendorDocument;

    @Prop({ default: null })
    url: string;

    @Prop({ type: [IRVIItemSchema], required: true })
    items: IRVIItem[];

    @Prop({ default: null })
    totalCost: number;

    @Prop({ default: 0 })
    netAmount: number;

    @Prop({ default: null })
    tax: number;

    @Prop({ default: 0 })
    remainCost: number;

    @Prop({ required: true, null: true })
    date: Date;

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
        enum: OrderPaymentStatus,
        default: OrderPaymentStatus.NotPaid,
    })
    paymentStatus: OrderPaymentStatus;

    @Prop({ type: String, enum: TaxIndication })
    taxIndication: TaxIndication;

    @Prop({ default: 0 })
    additionalCost: number;

    @Prop({ type: String, enum: IRVIType, default: IRVIType.IR })
    docType: IRVIType;

    @Prop({ default: null })
    dataId: string;

    @Prop({ default: false })
    isReturn: boolean;
}

export const IRVISchema =
    SchemaFactory.createForClass(IRVI);

IRVISchema.plugin(paginate);
IRVISchema.plugin(mongooseAggregatePaginate);