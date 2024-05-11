import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { EmpDocument } from './emp.schema';
import { CashierLogDocument } from 'src/cashier/schemas/cashier-log.schema';
import { DebtDocType, DebtPaymentStatus, DebtType, TransStatus } from 'src/core/Constants/enum';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type EmpDebtDocument = EmpDebt & Document;

@Schema({ timestamps: true })
export class EmpDebt {

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Emp',
        index: true,
        required: true,
    })
    empId: EmpDocument;

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


    @Prop({ type: Date })
    date: Date;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'CashierLog',
        index: true,
        required: false,
    })
    cashierLogId: CashierLogDocument;

    @Prop({ default: null })
    docNumber: string;

    @Prop({ default: null })
    referenceNumber: string;

    @Prop({ default: null })
    attachment?: string;

    @Prop({ default: null })
    notes?: string;

    @Prop({
        type: String,
        enum: DebtType,
        default: DebtType.Debt,
    })
    debtType: string;

    @Prop({ required: true, default: 0 })
    totalAmount: number;

    @Prop({ default: 0 })
    remainCost: number;

    @Prop({ default: 0 })
    paidAmount: number;

    @Prop({ default: false })
    isDebtReversal: boolean;

    @Prop({
        type: String,
        enum: TransStatus,
        default: TransStatus.Draft,
    })
    transType: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'EmpDebt',
        required: false,
        default: null
    })
    referenceEmpDebtId: EmpDebtDocument;

    @Prop({
        type: String,
        enum: DebtDocType,
        default: DebtDocType.Standard,
    })
    docType: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        default: null
    })
    otherGLAccount?: string;

    @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.Cash })
    paymentType: PaymentMethod;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

    @Prop({
        type: String,
        enum: DebtPaymentStatus,
        default: DebtPaymentStatus.NotPaid,
    })
    paymentStatus: DebtPaymentStatus;

}


export const EmpDebtSchema =
    SchemaFactory.createForClass(EmpDebt);
EmpDebtSchema.plugin(paginate);
EmpDebtSchema.plugin(mongooseAggregatePaginate);