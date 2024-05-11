import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import * as paginate from 'mongoose-paginate-v2';
import { GlAccountGroupDocument } from '../../gl-account-group/schemas/gl-account-group.schema';
import { OperationType } from '../enum/en.enum';
import { GlAccountSetDocument } from 'src/gl-account-set/schemas/gl-account-set.schema';

export type ReportingGroupDocument = ReportingGroup & Document;

@Schema({ timestamps: false, _id: false })
export class Aggregate {
  @Prop({ type: [Number], required: true })
  groupOrders: number[];

  @Prop({ type: String, enum: OperationType, required: true })
  operation: OperationType;
}
const AggregateSchema = SchemaFactory.createForClass(Aggregate);

@Schema({ timestamps: false })
export class ReportingGroup {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({ default: null })
  startOfGroup: string;

  @Prop({ default: null })
  endOfGroup: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccountSet',
    default: null,
  })
  glAccountSetId: GlAccountSetDocument;

  reportData?: [
    {
      _id: any;
      glAccountName: string;
      glAccountNameAr: string;
      glAccountNumber: number;
      credit: number;
      debit: number;
      total: number;
    },
  ];

  compareData?: any;

  aggregateData?: [
    {
      _id: any;
      glAccountName: string;
      glAccountNameAr: string;
      glAccountNumber: number;
      total: number;
    },
  ];

  compareAggregateData?: any;

  @Prop({ required: true })
  order: number;

  @Prop({ default: 0 })
  indent: number;

  @Prop({ default: false })
  bold: boolean;

  @Prop({ default: false })
  highlight: boolean;

  @Prop({ type: AggregateSchema, default: null })
  aggregate: Aggregate;

  @Prop({ type: [Object], default: [] })
  children: ReportingGroup[];

  @Prop({ default: false })
  negativeNature: boolean;
}

export const ReportingGroupSchema =
  SchemaFactory.createForClass(ReportingGroup);
