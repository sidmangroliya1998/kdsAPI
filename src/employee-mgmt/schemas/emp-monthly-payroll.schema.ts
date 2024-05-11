import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import * as paginate from 'mongoose-paginate-v2';
import { EmpDocument } from './emp.schema';

export type EmpMonthlySalaryDocument = EmpMonthlySalary & Document;


export class EmpMonthlyTimeSheetItem {

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Emp',
        index: true,
        required: true,
    })
    empId: EmpDocument;

    @Prop({ required: false })
    amount: number;

}
@Schema({ timestamps: true })
export class EmpMonthlySalary {

    @Prop({ type: Date })
    date: Date;

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

    @Prop({ required: false })
    monthNumber: number;

    @Prop({ required: false })
    yearNumber: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

    @Prop({ default: null })
    docNumber: string;

    @Prop({ default: null })
    totalAmount: number;

    @Prop({ default: null })
    paymentType: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAccount',
        index: true,
        required: false,
        null: true,
    })
    glAccountId: GlAccountDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

    @Prop({ type: [], required: true })
    timeSheetDetails: EmpMonthlyTimeSheetItem[];
}


export const EmpMonthlySalarySchema =
    SchemaFactory.createForClass(EmpMonthlySalary);
EmpMonthlySalarySchema.plugin(paginate);
