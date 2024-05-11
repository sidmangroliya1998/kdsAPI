import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

export type TrainingDocument = Training & Document;

@Schema({ timestamps: true })
export class Training {

    @Prop({ default: null })
    groupName?: string;
    
    @Prop({ default: null })
    groupNameAr?: string;

    @Prop({ default: null })
    name: string;

    @Prop({ default: null })
    nameAr: string;

    @Prop({ default: null })
    description: string;

    @Prop({ default: null })
    descriptionAr: string;

    @Prop({ default: null })
    videoURL: string;

    @Prop({ default: null })
    videoURLAr: string;
    
    @Prop({ default: null })
    imageURL: string;

    @Prop({ default: true })
    isActive: boolean;
}
export const TrainingSchema = SchemaFactory.createForClass(Training);
TrainingSchema.plugin(paginate);
