import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { Bank } from '../enum/en.enum';

export type PaymentBankFeesDocument = PaymentBankFees & Document;

@Schema({ timestamps: true })
export class PaymentBankFees {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: Object,
        default: {
            madaCard: 0,
            visaMaster: 0,
            americalExpress: 0
        },
    })
    bankFees: {
        madaCard: number,
        visaMaster: number,
        americalExpress: number
    };

    @Prop({
        type: Object,
        default: {
            madaCard: 0,
            visaMaster: 0,
            americalExpress: 0
        },
    })
    alRajhiBank: {
        madaCard: number,
        visaMaster: number,
        americalExpress: number
    };

    @Prop({
        type: Object,
        default: {
            madaCard: 0,
            visaMaster: 0,
            americalExpress: 0
        },
    })
    clickPayBank: {
        madaCard: number,
        visaMaster: number,
        americalExpress: number
    };

    @Prop({
        type: Object,
        default: {
            madaCard: 0,
            visaMaster: 0,
            americalExpress: 0
        },
    })
    nearPay: {
        madaCard: number,
        visaMaster: number,
        americalExpress: number
    };

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        index: true,
        ref: 'User',
    })
    addedBy: UserDocument;
}

export const PaymentBankFeesSchema = SchemaFactory.createForClass(PaymentBankFees);
PaymentBankFeesSchema.plugin(paginate);
