import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type PaymentFeesDocument = PaymentFees & Document;

@Schema({ timestamps: true })
export class PaymentFees {
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

    @Prop({ default: null })
    paymentDate: Date;

    @Prop({ default: null })
    madaCard: number;

    @Prop({ default: null })
    visaMaster: number;

    @Prop({ default: null })
    americalExpress: number;

    @Prop({ default: null })
    madaCardFee: number;

    @Prop({ default: null })
    visaMasterFee: number;

    @Prop({ default: null })
    americalExpressFee: number;

    @Prop({ default: null })
    madaCardTax: number;

    @Prop({ default: null })
    visaMasterTax: number;

    @Prop({ default: null })
    americalExpressTax: number;

    @Prop({ default: null })
    totalTax: number;

    @Prop({ default: null })
    totalAmount: number;

    @Prop({ default: null })
    totalFees: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAccount',
        index: true,
        required: true,
        null: false,
    })
    glAccountIdBank: GlAccountDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAccount',
        index: true,
        required: true,
        null: false,
    })
    glAccountIdFees: GlAccountDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

    @Prop({ default: null })
    docNumber: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;
}

export const PaymentFeesSchema = SchemaFactory.createForClass(PaymentFees);
PaymentFeesSchema.plugin(paginate);
