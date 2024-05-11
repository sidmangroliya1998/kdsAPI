import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

export type ProfitLossTemplateDocument = ProfitLossTemplate & Document;


@Schema({ timestamps: false })
export class ProfitLossSalesGroup {
    @Prop({ required: false })
    code: string;

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
}
export const ProfitLossSalesGroupSchema = SchemaFactory.createForClass(ProfitLossSalesGroup);

@Schema({ timestamps: false })
export class ProfitLossCogsGroup {
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
    children: ProfitLossCogsGroup[];

    @Prop({ default: null })
    salesGroupId: string;
}

export const ProfitLossCogsGroupSchema = SchemaFactory.createForClass(ProfitLossCogsGroup);

@Schema({ timestamps: false })
export class ProfitLossLaborGroup {
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
    children: ProfitLossLaborGroup[];

    @Prop({ default: null })
    salesGroupId: string;
}

export const ProfitLossLaborGroupSchema = SchemaFactory.createForClass(ProfitLossLaborGroup);


@Schema({ timestamps: false })
export class ProfitLossControllableExpense {
    @Prop({ required: false })
    code: string;

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
}
export const ProfitLossControllableExpenseSchema =
    SchemaFactory.createForClass(ProfitLossControllableExpense);

@Schema({ timestamps: false })
export class ProfitLossNonControllableExpense {
    @Prop({ required: false })
    code: string;

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
}
export const ProfitLossNonControllableExpenseSchema =
    SchemaFactory.createForClass(ProfitLossNonControllableExpense);

@Schema({ timestamps: false })
export class ProfitLossOther {
    @Prop({ required: false })
    code: string;

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
}
export const ProfitLossOtherSchema =
    SchemaFactory.createForClass(ProfitLossOther);



@Schema({ timestamps: true })
export class ProfitLossTemplate {
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

    @Prop({ type: [ProfitLossSalesGroupSchema], required: false })
    profitLossSalesGroup: ProfitLossSalesGroup[];

    @Prop({ type: [ProfitLossCogsGroupSchema], required: false })
    profitLossCogsGroup: ProfitLossCogsGroup[];

    @Prop({ type: [ProfitLossLaborGroupSchema], required: false })
    profitLossLaborGroup: ProfitLossLaborGroup[];

    @Prop({ type: [ProfitLossControllableExpenseSchema], required: false })
    profitLossControllableExpense: ProfitLossControllableExpense[];

    @Prop({ type: [ProfitLossNonControllableExpenseSchema], required: false })
    profitLossNonControllableExpense: ProfitLossNonControllableExpense[];

    @Prop({ type: [ProfitLossOtherSchema], required: false })
    profitLossOther: ProfitLossOther[];

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;
}

export const ProfitLossTemplateSchema = SchemaFactory.createForClass(
    ProfitLossTemplate,
);
