
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { EmpDocument } from './emp.schema';
import { OrderDocument } from 'src/order/schemas/order.schema';
import { TransStatus } from 'src/core/Constants/enum';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { OrderItemDocument, OrderItemSchema } from 'src/order/schemas/order-item.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type EmpMealDocument = EmpMeal & Document;

@Schema({ timestamps: true })
export class EmpMeal {

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
        ref: 'Emp',
        index: true,
        required: true,
    })
    empId: EmpDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Order',
        index: true,
        required: false,
    })
    orderId: OrderDocument;

    @Prop({ default: null })
    referenceNumber: string;

    @Prop({ default: null })
    notes: string;

    @Prop({ default: null })
    docNumber: string;

    @Prop({ type: [], default: [] })
    items: any[];

    @Prop({
        type: String,
        enum: TransStatus,
        default: TransStatus.Draft,
    })
    transType: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;

}

export const EmpMealSchema =
    SchemaFactory.createForClass(EmpMeal);
EmpMealSchema.plugin(paginate);

