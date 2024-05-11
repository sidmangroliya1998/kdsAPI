
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { MaterialDocument } from 'src/material/schemas/material.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { TransferRequestStatus } from '../enum/en';

export type InventoryTransferRequestDocument = InventoryTransferRequest & Document;

@Schema({ _id: false })
class TransferInventoryReqHistory {

  @Prop({ type: String, enum: TransferRequestStatus, default: TransferRequestStatus.New })
  requestStatus: TransferRequestStatus;

  @Prop({ required: false })
  statusUpdatedDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
    required: false
  })
  statusUpdatedBy: UserDocument;
}

const TransferHistorySchema = SchemaFactory.createForClass(TransferInventoryReqHistory);

@Schema({ _id: false })
class TransferInventoryReqItem {

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Material',
    index: true,
    required: true,
  })
  materialId: MaterialDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    required: true,
  })
  uom: UnitOfMeasureDocument;

  @Prop({ required: true })
  stock: number;

}
const TransferItemSchema = SchemaFactory.createForClass(TransferInventoryReqItem);

@Schema({ timestamps: true })
export class InventoryTransferRequest {
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
  sourceRestaurantId: RestaurantDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
    required: true,
  })
  targetRestaurantId: RestaurantDocument;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: [TransferItemSchema], required: true })
  items: TransferInventoryReqItem[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ default: null })
  attachment?: string;

  @Prop({ default: null })
  referenceNumber?: string;

  @Prop({ type: String, enum: TransferRequestStatus, default: TransferRequestStatus.New })
  requestStatus: TransferRequestStatus;

  @Prop({ required: false })
  statusUpdatedDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
    required: false
  })
  statusUpdatedBy: UserDocument;

  @Prop({ default: null })
  docNumber: string;

  @Prop({ type: [TransferHistorySchema], required: false })
  history: TransferInventoryReqHistory[];
}

export const InventoryTransferRequestSchema =
  SchemaFactory.createForClass(InventoryTransferRequest);

InventoryTransferRequestSchema.plugin(paginate);