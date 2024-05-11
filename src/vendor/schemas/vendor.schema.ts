import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { VendorType } from '../enum/en';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { GlVendorCodeDocument } from 'src/gl-vendor-code/schemas/gl-vendor-code.schema';

export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true })
export class Vendor {

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;
  
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    default: null,
  })
  externalVendorId?: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlVendorCode',
    index: true,
    default: null,
  })
  glVendorCodeId: GlVendorCodeDocument;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  phoneNumber: string;

  @Prop({ default: null })
  address: string;

  @Prop({ default: null })
  contactPerson: string;

  @Prop({ default: VendorType.External, type: String, enum: VendorType })
  type: VendorType;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    default: null,
  })
  addedBy: VendorDocument;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ default: null })
  vatNumber: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

VendorSchema.plugin(paginate);
