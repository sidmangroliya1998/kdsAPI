import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import { AdminDocument } from 'src/admin/schemas/admin.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { GlAccountDocument } from './gl-account.schema';

export type GlAccountBalanceDocument = GlAccountBalance & Document;

@Schema({ timestamps: true })
export class GlAccountBalance {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Supplier',
        index: true,
        required: true,
    })
    supplierId: SupplierDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlAccount',
        index: true,
        required: true,
        null: false,
    })
    glAccountId: GlAccountDocument;

    @Prop({ required: true })
    totalCredit: number;

    @Prop({ required: true })
    totalDebit: number;

    @Prop({ required: true })
    totalBalance: number;
}

export const GlAccountBalanceSchema = SchemaFactory.createForClass(GlAccountBalance);
GlAccountBalanceSchema.plugin(paginate);
