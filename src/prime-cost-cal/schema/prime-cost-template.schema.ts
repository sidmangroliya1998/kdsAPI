import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

export type PrimeCostTemplateDocument = PrimeCostTemplate &
    Document;


@Schema({ timestamps: false })
export class SalesGroup {
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

    @Prop({ type: [Object], default: [] })
    children: SalesGroup[];
}

export const SalesGroupSchema = SchemaFactory.createForClass(SalesGroup);


@Schema({ timestamps: false })
export class CogsGroup {
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
    children: CogsGroup[];

    @Prop({ default: null })
    salesGroupId: string;
}

export const CogsGroupSchema = SchemaFactory.createForClass(CogsGroup);

@Schema({ timestamps: false })
export class LaborGroup {
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
    children: LaborGroup[];

    @Prop({ default: null })
    salesGroupId: string;
}

export const LaborGroupSchema = SchemaFactory.createForClass(LaborGroup);



@Schema({ timestamps: true })
export class PrimeCostTemplate {
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

    @Prop({ type: [SalesGroupSchema], required: false })
    salesGroup: SalesGroup[];

    @Prop({ type: [SalesGroupSchema], required: false })
    cogsGroup: CogsGroup[];

    @Prop({ type: [SalesGroupSchema], required: false })
    laborGroup: LaborGroup[];

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;
}

export const PrimeCostTemplateSchema = SchemaFactory.createForClass(
    PrimeCostTemplate,
);
