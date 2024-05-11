import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { EmpTimeSheetItem, EmpTimeSheetItemSchema } from './emp-hourly-item.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

export type EmpTimeSheetDocument = EmpTimeSheet & Document;

@Schema({ timestamps: true })
export class EmpTimeSheet {

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

    @Prop({ required: true })
    weekStartDate: Date;

    @Prop({ type: [], required: true })
    timeSheetDetails: EmpTimeSheetItem[];

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

    @Prop({ required: false })
    docNumber: string;

    @Prop({ required: false })
    totalAmount: number;


}

export const EmpTimeSheetSchema =
    SchemaFactory.createForClass(EmpTimeSheet);
EmpTimeSheetSchema.plugin(paginate);
