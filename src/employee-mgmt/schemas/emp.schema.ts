import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';

import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { EmployeePayPlan, EmployeeType } from '../enum/en';

export type EmpDocument = Emp & Document;

@Schema({ timestamps: true })
export class Emp {
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

    @Prop({ required: true, index: true })
    empCode: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: false })
    address: string;

    @Prop({ required: false })
    phone: string;

    @Prop({ required: false })
    idProof: string;

    @Prop({ type: String, enum: EmployeePayPlan, required: true })
    payPlan: EmployeePayPlan;

    @Prop({ required: false })
    hourlyRate: number;

    @Prop({ required: false })
    monthlySalary: number;

    @Prop({ required: false })
    benefitMarkup: number;

    @Prop({ required: false })
    weeklyWorkingDays: number;

    @Prop({ required: false })
    monthlyWorkingDays: number;

    @Prop({ required: false })
    employementDay: Date;

    @Prop({ required: false })
    releaseDate: Date;

    @Prop({ type: String, enum: EmployeeType, default: EmployeeType.Staff, required: true })
    employeeType: EmployeeType;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;

    @Prop({ required: false })
    sequenceNumber: string;
}

export const EmpSchema =
    SchemaFactory.createForClass(Emp);
EmpSchema.plugin(paginate);
