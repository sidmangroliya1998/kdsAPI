import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

export type BalanceSheetTemplateDocument = BalanceSheetTemplate &
    Document;



@Schema({ timestamps: false })
export class FixedAssets {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: null })
    nameAr: string;

    @Prop({ default: 0 })
    indent: number;

    @Prop({
        type: [MongooseSchema.Types.ObjectId],
        ref: 'GlAccount',
        index: true,
        required: false,
    })
    glAccountIds: GlAccountDocument[];

    @Prop({ type: [Object], default: [] })
    children: FixedAssets[];
}
export const FixedAssetsSchema = SchemaFactory.createForClass(FixedAssets);

@Schema({ timestamps: false })
export class CurrentAssets {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: null })
    nameAr: string;

    @Prop({ default: 0 })
    indent: number;

    @Prop({
        type: [MongooseSchema.Types.ObjectId],
        ref: 'GlAccount',
        index: true,
        required: false,
    })
    glAccountIds: GlAccountDocument[];

    @Prop({ type: [Object], default: [] })
    children: CurrentAssets[];
}
export const CurrentAssetsSchema = SchemaFactory.createForClass(CurrentAssets);

@Schema({ timestamps: false })
export class Assets {
    @Prop({ required: false })
    currentAsset: CurrentAssets;

    @Prop({ required: false })
    fixedAsset: FixedAssets;
}
export const AssetsSchema = SchemaFactory.createForClass(Assets);


@Schema({ timestamps: false })
export class Liabilities {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: null })
    nameAr: string;

    @Prop({ default: 0 })
    indent: number;

    @Prop({
        type: [MongooseSchema.Types.ObjectId],
        ref: 'GlAccount',
        index: true,
        required: false,
    })
    glAccountIds: GlAccountDocument[];

    @Prop({ type: [Object], default: [] })
    children: Liabilities[];
}
export const LiabilitiesSchema = SchemaFactory.createForClass(Liabilities);


@Schema({ timestamps: false })
export class Equity {
    @Prop({ required: true, index: true })
    name: string;

    @Prop({ default: null })
    nameAr: string;

    @Prop({ default: 0 })
    indent: number;

    @Prop({
        type: [MongooseSchema.Types.ObjectId],
        ref: 'GlAccount',
        index: true,
        required: false,
    })
    glAccountIds: GlAccountDocument[];

    @Prop({ type: [Object], default: [] })
    children: Equity[];
}
export const EquitySchema = SchemaFactory.createForClass(Equity);


@Schema({ timestamps: false })
export class LiabilityAndEquity {
    @Prop({ required: false })
    liabilities: Liabilities;

    @Prop({ required: false })
    equity: Equity;

    @Prop({ default: 0 })
    indent: number;
}

export const LiabilityAndEquitySchema = SchemaFactory.createForClass(LiabilityAndEquity);


@Schema({ timestamps: true })
export class BalanceSheetTemplate {
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

    @Prop({ type: AssetsSchema, required: false })
    assets: Assets;

    @Prop({ type: LiabilityAndEquitySchema, required: false })
    liabilityAndEquity: LiabilityAndEquity;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;
}

export const BalanceSheetTemplateSchema = SchemaFactory.createForClass(
    BalanceSheetTemplate,
);