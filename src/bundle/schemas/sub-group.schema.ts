import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import * as paginate from 'mongoose-paginate-v2';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { MenuAdditionDocument } from 'src/menu/schemas/menu-addition.schema';

export type SubGroupDocument = SubGroup & Document;

@Schema({})
export class SubGroup {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'MenuItem',
    required: true,
  })
  items: MenuItemDocument[];

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'MenuAddition',
    required: true,
  })
  additions: MenuAdditionDocument[];

  @Prop({ default: false })
  additionPricingIncluded: boolean;

  @Prop({ default: null })
  maxAllowedQuantities: number;
}

export const SubGroupSchema = SchemaFactory.createForClass(SubGroup);
SubGroupSchema.plugin(paginate);
