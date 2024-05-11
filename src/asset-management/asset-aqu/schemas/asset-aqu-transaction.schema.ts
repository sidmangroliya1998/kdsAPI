
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { AssetAquDocument } from './asset-aqu.schema';
import { GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { TaxIndication } from 'src/expense/enum/en';

export type AssetAquTransDocument = AssetAquTrans & Document;

@Schema({ timestamps: true })
export class AssetAquTrans {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Vendor',
        index: true,
        required: true,
    })
    vendorId: VendorDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'AssetAqu',
        required: true,
        index: true,
    })
    assetAquId: AssetAquDocument;

    @Prop({ required: false })
    description: string;

    @Prop({ required: false })
    descriptionAr: string;

    @Prop({ required: false })
    grossAmount: number;

    @Prop({ required: false })
    net: number;

    @Prop({ required: false })
    tax: number;

    @Prop({ type: String, enum: TaxIndication })
    taxIndication: TaxIndication;

    @Prop({ required: false })
    amount: number;

    @Prop({ default: null })
    docNumber: string;

    @Prop({ type: Date })
    date: Date;

    @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.Cash })
    paymentType: PaymentMethod;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAccount',
        index: true,
        required: false,
        null: true,
    })
    glAccountId: GlAccountDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        default: null,
        ref: 'GlVoucher',
    })
    glVoucherId: GlVoucherDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;

}

export const AssetAquTransSchema = SchemaFactory.createForClass(AssetAquTrans);
AssetAquTransSchema.plugin(paginate);
