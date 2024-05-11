import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { GLTransStatus, IntervalType } from '../enum/en.enum';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlVoucherItem, GlVoucherItemSchema } from './gl-voucher-item.schema';
import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from './gl-voucher.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';

export type GlVoucherRecurringDocument = GlVoucherRecurring & Document;

@Schema()
export class TriggerHistory {
    @Prop({ type: Date, required: true })
    postedDate: Date;

    @Prop({ default: true })
    isTriggered: boolean;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

    @Prop({ type: Date, required: true })
    executionDate: Date;
}
export const TriggerHistorySchema = SchemaFactory.createForClass(TriggerHistory);

@Schema()
export class Trigger {
    @Prop({ type: String, enum: IntervalType, default: IntervalType.Monthly })
    intervalType: string;

    @Prop({ type: Number, default: 1 })
    interval: number;

    @Prop({
        type: [Number], enum: [0, 1, 2, 3, 4, 5, 6], default: []
    })
    daysOfWeek: number[];

    @Prop({ type: [{ type: Number, min: 1, max: 31 }], default: [] })
    daysOfMonth: number[];

    @Prop({ type: [{ day: { type: Number, min: 1, max: 31 }, month: { type: Number, min: 1, max: 12 } }], default: [] })
    specificDate: { day: number; month: number }[];

}
export const TriggerSchema = SchemaFactory.createForClass(Trigger);
@Schema({ timestamps: true })
export class GlVoucherRecurring {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    })
    restaurantId: RestaurantDocument;

    @Prop({ default: null })
    description: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;

    @Prop({ type: String, enum: GLTransStatus, default: GLTransStatus.Approved })
    transStatus: GLTransStatus;

    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date, required: true })
    endDate: Date;

    @Prop({ type: Date, required: true })
    date: Date;

    @Prop({ type: TriggerSchema, required: true }) // Reference the TriggerSchema here
    trigger: Trigger;

    @Prop({ type: [GlVoucherItemSchema], required: true })
    items: GlVoucherItem[];

    @Prop({ type: [TriggerHistorySchema], default: [] })
    history: TriggerHistory[];

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Vendor',
        default: null,
    })
    vendorId: VendorDocument;

    @Prop({ default: null })
    vendorName: string;

    @Prop({ default: null })
    attachment: string;

    @Prop({ default: null })
    referenceNumber: string;
}

export const GlVoucherRecurringSchema = SchemaFactory.createForClass(GlVoucherRecurring);
GlVoucherRecurringSchema.plugin(paginate);