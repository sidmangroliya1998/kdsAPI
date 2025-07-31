import { SupplierDocument } from "src/supplier/schemas/suppliers.schema";
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { RestaurantDocument } from "src/restaurant/schemas/restaurant.schema";
import { BulkTaskType, TaskStatus } from "../enum/en";
import * as paginate from 'mongoose-paginate-v2';

export type TaskManagementDocument = TaskManagement & Document;

@Schema({ timestamps: true })
export class TaskManagement {
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

    @Prop({ required: true })
    fileURL: string;

    @Prop({ type: String, enum: BulkTaskType, required: false, default: BulkTaskType.NotAssigned })
    taskType: BulkTaskType;

    @Prop({ type: String, enum: TaskStatus, required: false, default: TaskStatus.Pending })
    taskStatus: TaskStatus;

    @Prop({ required: false })
    approvedDate: Date;

    @Prop({ required: false, default: 0 })
    totalAmount: number;

    @Prop({ required: false, default: 0 })
    totalTax: number;

    @Prop({ required: false, default: 0 })
    totalNet: number;

    @Prop({ required: true })
    docNumber: string;

    @Prop({ required: false })
    referenceDocId: string;

    @Prop({ required: false })
    referenceDocNumber: string; //Voucher number

    @Prop({ required: false })
    docPostedDate: Date;

    @Prop({ type: MongooseSchema.Types.Mixed })
    docObject: any;

    @Prop({ required: false })
    docReferenceNumber: string; // Reference Number
}
export const TaskManagementSchema = SchemaFactory.createForClass(TaskManagement);

TaskManagementSchema.plugin(paginate);