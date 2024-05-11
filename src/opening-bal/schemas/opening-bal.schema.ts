import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';

export type OpeningBalDocument = OpeningBal & Document;

@Schema({ timestamps: true })
export class OpeningBal {
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
        ref: 'GlAccount',
        index: true,
        required: true,
        null: false,
    })
    glAccountId: GlAccountDocument;

    @Prop({ required: true, null: true })
    date: Date;

    @Prop({ default: null })
    description: string;

    @Prop({ default: null })
    descriptionAr: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

    @Prop({ default: null })
    deletedAt: Date;

    @Prop({ default: null })
    docNumber: string;

    @Prop({ default: null })
    totalCost: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

}

export const OpeningBalSchema = SchemaFactory.createForClass(OpeningBal);
OpeningBalSchema.plugin(paginate);
