import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import * as paginate from 'mongoose-paginate-v2';
import { SubGroupDocument, SubGroupSchema } from './sub-group.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';

@Schema({})
class OfferValidity {
  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Object, default: null })
  validTime: {
    startTime: string;
    endTime: string;
  };
}

export const OfferValiditySchema = SchemaFactory.createForClass(OfferValidity);

export type BundleDocument = Bundle & Document;

@Schema({ timestamps: true })
export class Bundle {
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

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  image: string;

  @Prop({ default: null })
  descriptionAr: string;

  @Prop({ type: [SubGroupSchema], required: true })
  subGroups: SubGroupDocument[];

  @Prop({ type: OfferValiditySchema, _id: false })
  offerValidity: OfferValidity;

  @Prop({ required: true })
  price: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  addedBy: UserDocument;

  isValid: boolean;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'Restaurant',
    index: true,
    default: [],
  })
  availableRestaurants: RestaurantDocument[];

  @Prop({ default: null })
  deletedAt: Date;

}

export const BundleSchema = SchemaFactory.createForClass(Bundle);
BundleSchema.plugin(paginate);
