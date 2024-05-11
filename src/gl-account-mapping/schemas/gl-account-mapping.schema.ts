import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { UserDocument } from 'src/users/schemas/users.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';

import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { PurchaseCategoryDocument } from 'src/purchase-category/schemas/purchase-category.schema';
import { ListDocument } from 'src/list/schemas/list.schema';
import { GlRevenueCodeDocument } from 'src/gl-revenue-code/schemas/gl-revenue-code.schema';
import { GlAssetCodeDocument } from 'src/gl-asset-code/schemas/create-gl-asset.schema';
import { GlTaxIndicationDocument } from 'src/gl-tax-indication/schemas/gl-tax-indication.schema';

export type GlAccountMappingDocument = GlAccountMapping & Document;

@Schema({ timestamps: false, _id: false })
export class PurchaseCategoryMapping {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PurchaseCategory',
    required: true,
  })
  category: PurchaseCategoryDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    required: true,
    null: true,
  })
  glAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const PurchaseCategoryMappingSchema = SchemaFactory.createForClass(
  PurchaseCategoryMapping,
);

@Schema({ timestamps: false, _id: false })
export class GlMaterialCodes {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PurchaseCategory',
    required: true,
  })
  glMatCodeId: PurchaseCategoryDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  invengtoryGlAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  grirGlAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const GlMaterialCodesSchema =
  SchemaFactory.createForClass(GlMaterialCodes);

@Schema({ timestamps: false, _id: false })
export class GlVenCodes {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PurchaseCategory',
    required: true,
  })
  glVenCodeId: PurchaseCategoryDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  glAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const GlVenCodesSchema = SchemaFactory.createForClass(GlVenCodes);

@Schema({ timestamps: false, _id: false })
export class GlRevenueCodes {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlRevenueCode',
    required: false,
  })
  glRevenueCodeId: GlRevenueCodeDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  glAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const GlRevenueCodesSchema = SchemaFactory.createForClass(GlRevenueCodes);



@Schema({ timestamps: false, _id: false })
export class GlAssetCodes {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAssetCode',
    required: false,
  })
  glAssetCodeId: GlAssetCodeDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  assetAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  depreciationExpenseAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  accumulatedAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  retirementLossAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const GlAssetCodesSchema = SchemaFactory.createForClass(GlAssetCodes);



@Schema({ timestamps: false, _id: false })
export class GlTaxIndicationCode {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlTaxIndication',
    required: false,
  })
  glTaxIndicationId: GlTaxIndicationDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    default: null,
  })
  glAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const GlTaxIndicationCodeSchema =
  SchemaFactory.createForClass(GlTaxIndicationCode);

@Schema({ timestamps: false, _id: false })
export class GlMappingDetail {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GlAccount',
    required: true,
    null: true,
  })
  glAccount: GlAccountDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  costCenter: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  segment: ListDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'List',
    index: true,
    default: null,
  })
  purpose: ListDocument;
}

export const GlMappingDetailSchema =
  SchemaFactory.createForClass(GlMappingDetail);

@Schema({ timestamps: true })
export class GlAccountMapping {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    default: null,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  cash: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  bank: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  card: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  online: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  softPos: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  deferred: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  accountReceivable: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  crRevenue: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  crShishaTax: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  crOutputTax: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  drInputTax: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  wasteExpense: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  sfInterCompany: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  cogsAccount: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  customerAccountReceivables: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  taxClearing: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  gainAndLoss: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  avgPriceChange: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  salaryExpense: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  salaryAccural: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  employeeExpense: GlMappingDetail;

  @Prop({
    type: GlMappingDetailSchema,
    default: null,
    null: true,
  })
  consumptionGlAccount: GlAccountDocument;

  @Prop({ type: [PurchaseCategoryMappingSchema], default: [] })
  purchaseCategories: PurchaseCategoryMapping[];

  @Prop({ type: [GlMaterialCodesSchema], default: [] })
  materialCodes: GlMaterialCodes[];

  @Prop({ type: [GlVenCodesSchema], default: [] })
  glVenCodes: GlVenCodes[];

  @Prop({ type: [GlRevenueCodesSchema], default: [] })
  glRevenueCodes: GlRevenueCodes[];

  @Prop({ type: [GlAssetCodesSchema], default: [] })
  glAssetCodes: GlAssetCodes[];

  @Prop({ type: [GlTaxIndicationCodeSchema], default: [] })
  glTaxIndicationCodes: GlTaxIndicationCode[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  addedBy: UserDocument;
}
export const GlAccountMappingSchema =
  SchemaFactory.createForClass(GlAccountMapping);
GlAccountMappingSchema.plugin(paginate);
