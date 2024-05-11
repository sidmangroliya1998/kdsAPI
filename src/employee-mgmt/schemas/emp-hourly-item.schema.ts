import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { EmpDocument } from './emp.schema';

export type EmpTimeSheetItemDocument = EmpTimeSheetItem & EmpTimeSheetItemData & Document;

@Schema({ timestamps: true })
export class EmpTimeSheetItemData {
    @Prop({ required: false })
    timeSheetDate: Date;

    @Prop({ required: false })
    hourAmount: number;

    @Prop({ required: false })
    hourCost: number;

    @Prop({ required: false })
    hourTotal: number;
}

export const EmpTimeSheetItemDataSchema =
    SchemaFactory.createForClass(EmpTimeSheetItemData);

export class EmpTimeSheetItem {

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Emp',
        index: true,
        required: true,
    })
    empId: EmpDocument;

    @Prop({ type: [], required: true })
    timeSheetDetailsItemData: EmpTimeSheetItemData[];
}

export const EmpTimeSheetItemSchema =
    SchemaFactory.createForClass(EmpTimeSheetItem);
EmpTimeSheetItemSchema.plugin(paginate);




