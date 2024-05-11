import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import {
  MarketPlace,
  MarketPlaceSchema,
} from 'src/market-place/shemas/market-place.schem';
import { marketPlaceDefaultValues } from 'src/core/Constants/market.contants';
import { TranslateEditorModuleName } from 'src/core/Constants/enum';

export type TranslateEditorDocument = TranslateEditor & Document;

@Schema({ timestamps: true })
export class TranslateEditor {

  @Prop({ 
    required: true ,
    enum: TranslateEditorModuleName,
    default: TranslateEditorModuleName.Accounting,
  })
  moduleName: string;

  @Prop({ required: true  })
  enFileURL: string;

  @Prop({ required: true  })
  arFileURL: string;
}

export const TranslateEditorSchema = SchemaFactory.createForClass(TranslateEditor);
TranslateEditorSchema.plugin(paginate);
