import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { UserDocument } from 'src/users/schemas/users.schema';
import { GLHistoryActionType } from '../enum/en.enum';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { GlVoucherDocument } from './gl-voucher.schema';

export type GlVoucherHistoryDocument = GlVoucherHistory & Document;

@Schema({ timestamps: true })
export class GlVoucherHistory {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'GlVoucher',
        required: true,
    })
    glVoucherId: GlVoucherDocument;

    @Prop({ type: String, enum: GLHistoryActionType, default: GLHistoryActionType.AutoEntry })
    type: GLHistoryActionType;

    @Prop({ default: null })
    description: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    addedBy: UserDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        index: true,
    })
    updatedBy: UserDocument;

    @Prop({ default: true })
    isSystemGenerated: boolean;

}
export const GlVoucherHistorySchema = SchemaFactory.createForClass(GlVoucherHistory);
GlVoucherHistorySchema.plugin(paginate);