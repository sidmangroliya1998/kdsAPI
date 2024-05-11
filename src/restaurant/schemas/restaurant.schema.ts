import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Days, OrderTypes } from 'src/core/Constants/enum';
import * as paginate from 'mongoose-paginate-v2';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/users/schemas/users.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { ImportDocument } from 'src/import/schemas/import.schema';
import { AutoCachePlugin } from 'src/cache/plugin/auto-cache.plugin';

export type RestaurantDocument = Restaurant & Document;

@Schema({ _id: false })
export class IndividualWorkingHours {
  @Prop({ type: String, enum: Days, required: true })
  day: Days;

  @Prop({ required: true })
  start: string;

  @Prop({ required: true })
  end: string;
}
export const IndividualWorkingHoursSchema = SchemaFactory.createForClass(
  IndividualWorkingHours,
);

@Schema({ _id: false })
class TermsAndCondition {
  @Prop({ type: String, enum: OrderTypes, required: false })
  type: OrderTypes;

  @Prop({ required: false })
  termsAr: string;

  @Prop({ required: false })
  termsEn: string;
}
const TermsAndConditionSchema = SchemaFactory.createForClass(TermsAndCondition);

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ required: false })
  city: string;

  @Prop({ default: null })
  whatsappNumber: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: false })
  enableWhatsappCommunication: boolean;

  @Prop({ default: { en: null, ar: null }, type: Object })
  beforeConfirmOrderMessage: {
    en: string;
    ar: string;
  };

  @Prop({ default: { start: '08:00', end: '22:00' }, type: Object })
  defaultWorkingHours: {
    start: string;
    end: string;
  };

  @Prop({ default: [], type: [IndividualWorkingHoursSchema] })
  overrideWorkingHours: IndividualWorkingHours[];

  @Prop({ default: true })
  isMenuBrowsingEnabled: boolean;

  @Prop({ default: true })
  isAppOrderEnabled: boolean;

  @Prop({ default: true })
  isDeliveryEnabled: boolean;

  @Prop({ default: true })
  isPickupOrderEnabled: boolean;

  @Prop({ default: true })
  isScheduledOrderEnabled: boolean;

  @Prop({ default: true })
  isDeliveryToCarEnabled: boolean;

  @Prop({ default: true })
  isReservationEnabled: boolean;

  @Prop({ default: true })
  isWaitingEnabled: boolean;

  @Prop({ default: null })
  minimumDeliveryOrderValue: number;

  @Prop({ type: Object })
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: number;
    country: string;
    latitude: number;
    longitude: number;
    district: string;
  };

  @Prop({ default: false })
  active: boolean;

  @Prop({ default: [], type: [TermsAndConditionSchema], required: false })
  terms: TermsAndCondition[];

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Import',
    default: null,
  })
  importId: ImportDocument;

  @Prop({
    default: null,
  })
  pickupId: string;

  @Prop({ default: true })
  isMainBranch: boolean;

  @Prop({ default: true })
  quickCashierImage: boolean;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
RestaurantSchema.plugin(paginate);
RestaurantSchema.plugin(AutoCachePlugin);
