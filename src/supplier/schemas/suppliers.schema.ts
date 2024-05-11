import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { ImportDocument } from 'src/import/schemas/import.schema';
import {
  IndividualWorkingHours,
  IndividualWorkingHoursSchema,
} from 'src/restaurant/schemas/restaurant.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { Language, SupplierType } from '../enum/en';
import { AutoCachePlugin } from 'src/cache/plugin/auto-cache.plugin';
import {
  MarketPlace,
  MarketPlaceSchema,
} from 'src/market-place/shemas/market-place.schem';
import { marketPlaceDefaultValues } from 'src/core/Constants/market.contants';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true })
  alias: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  nameAr: string;

  @Prop({ default: null })
  about: string;

  @Prop({ default: null })
  aboutAr: string;

  @Prop({ default: null })
  goals: string;

  @Prop({ default: null })
  goalsAr: string;

  @Prop({ default: null })
  returnPolicy: string;

  @Prop({ default: null })
  returnPolicyAr: string;

  @Prop({ default: null })
  vatNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: null })
  phoneNumber: string;

  @Prop({ default: null })
  logo: string;

  @Prop({ default: null })
  backgroundImage: string;

  @Prop({ default: null })
  twitter: string;

  @Prop({ default: null })
  instagram: string;

  @Prop({ default: null })
  snapchat: string;

  @Prop({ default: null })
  tiktok: string;

  @Prop({ default: null })
  whatsapp: string;

  @Prop({ default: null })
  domain: string;

  @Prop({ default: true })
  restaurant: boolean;

  @Prop({ default: null })
  crDoc: string;

  @Prop({ default: null })
  mancucpilityCertDoc: string;

  @Prop({ default: null })
  incorporationContractDoc: string;

  @Prop({ default: null })
  ibanCertDoc: string;

  @Prop({ default: null })
  idDoc: string;

  @Prop({ default: true })
  taxEnabled: boolean;

  @Prop({ default: Tax.rate })
  taxRate: number;

  @Prop({ default: 0 })
  reservationFee: number;

  @Prop({ default: true })
  taxEnabledOnReservationFee: boolean;

  @Prop({ default: true })
  taxEnabledOnTableFee: boolean;

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

  @Prop({ default: true })
  customerAuthForDeliveryOrder: boolean;

  @Prop({ default: true })
  customerAuthForPickupOrder: boolean;

  @Prop({ default: true })
  customerAuthForDineInOrder: boolean;

  @Prop({ default: true })
  customerAuthForTableActivities: boolean;

  @Prop({ default: false })
  iswhatsappOpted: boolean;

  @Prop({ default: false })
  iswhatsappConnected: boolean;

  @Prop({ default: false })
  isAutowhatsappAttempted: boolean;

  @Prop({ default: true })
  acceptTip: boolean;

  @Prop({ default: 0 })
  feeRate: number;

  @Prop({ default: { start: '08:00', end: '22:00' }, type: Object })
  defaultWorkingHours: {
    start: string;
    end: string;
  };

  @Prop({ default: [], type: [IndividualWorkingHoursSchema] })
  overrideWorkingHours: IndividualWorkingHours[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: TIMEZONE })
  timezone: string;

  @Prop({ default: true })
  isRestaurant: boolean;

  @Prop({ default: false })
  isVendor: boolean;

  @Prop({ default: false })
  isSmallRestaurant: boolean;

  @Prop({ default: false })
  isLargeKitchenReceipt: boolean;

  @Prop({ default: false })
  canBeDeferred: boolean;

  @Prop({ default: false })
  massInvoice: boolean;

  @Prop({ type: String, default: Language.Ar, enum: Language })
  kitchenReceiptLanguage: Language;

  @Prop({ type: String, default: Language.Ar, enum: Language })
  cashierReceiptLanguage: Language;

  @Prop({ default: null })
  themeColor: string;

  @Prop({ default: false })
  tobaccoFeeInvoices: boolean;

  @Prop({ default: false })
  disableAutoCashierPrint: boolean;

  @Prop({ default: false })
  disableAutoCashierReceiptPrint: boolean;

  @Prop({ default: false })
  disableAutoKitchenReceiptPrint: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Import',
    default: null,
  })
  importId: ImportDocument;

  @Prop({ default: false })
  autoTransferSaleGl: boolean;

  @Prop({ default: false })
  autoTransferExpenseGl: boolean;

  @Prop({ default: false })
  autoTransferPurchaseGl: boolean;

  @Prop({ default: false })
  autoTransferGoodsReceiptGl: boolean;

  @Prop({ default: false })
  autoTransferInvoiceReceiptGl: boolean;

  @Prop({ default: false })
  autoTransferWasteEventGl: boolean;

  @Prop({ default: false })
  autoTransferStockTransferGl: boolean;

  @Prop({ default: false })
  autoTransferRecipeProductionGl: boolean;

  @Prop({ default: false })
  autoTransferSalesGoodsGl: boolean;

  @Prop({ default: false })
  autoTransferInventoryCountGl: boolean;

  @Prop({ default: false })
  applyAccountingOnPayment: boolean;

  @Prop({ default: false })
  autoTransferPriceChange: boolean;

  @Prop({ default: false })
  stockInventoryNotification: boolean;

  @Prop({ default: null, null: true })
  lastWhatsappConnectionTime: Date;

  @Prop({ default: null, null: true })
  lastWhatsappDisconnectionTime: Date;

  @Prop({
    default: marketPlaceDefaultValues,
    type: [{ type: MarketPlaceSchema }],
  })
  marketPlaces: MarketPlace[];

  @Prop({ default: null })
  logoPng: string;

  @Prop({ default: null })
  backgroundImagePng: string;

  @Prop({ default: false })
  isMaster: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
SupplierSchema.plugin(paginate);
SupplierSchema.plugin(AutoCachePlugin);
