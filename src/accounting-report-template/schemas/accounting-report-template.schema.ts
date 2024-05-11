import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import * as paginate from 'mongoose-paginate-v2';
import { ReportingGroup, ReportingGroupSchema } from './reporting-group.schema';

export type AccountingReportTemplateDocument = AccountingReportTemplate &
  Document;

@Schema({ timestamps: true })
export class AccountingReportTemplate {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({ type: [ReportingGroupSchema], required: true })
  reportingGroup: ReportingGroup[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  addedBy: UserDocument;
}

export const AccountingReportTemplateSchema = SchemaFactory.createForClass(
  AccountingReportTemplate,
);
AccountingReportTemplateSchema.plugin(paginate);
