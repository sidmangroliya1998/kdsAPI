import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  ValidateNested,
  IsArray,
  IsMongoId,
  IsDate,
  MinDate,
  IsEnum,
} from 'class-validator';
import {
  DefaultWorkingHoursDTO,
  IndividualWorkHoursDTO,
} from 'src/restaurant/dto/create-restaurant.dto';
import * as moment from 'moment';
import { Language, SupplierType } from './enum/en';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ToBoolean } from 'src/core/Helpers/custom.validators';

export class MarketPlacesDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  value: boolean;
}

export class AddSupplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  alias: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  aboutAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  goals?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  goalsAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  returnPolicy?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  returnPolicyAr?: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vatNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  twitter?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  snapchat?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tiktok?: string;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value.replace('+', ''))
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  crDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mancucpilityCertDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  incorporationContractDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ibanCertDoc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idDoc?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  taxEnabled?: boolean;

  @ApiProperty({ required: false, example: 15 })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  taxEnabledOnTableFee?: boolean;

  @ApiProperty({ required: false, example: 0 })
  @IsNumber()
  @IsOptional()
  reservationFee?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  taxEnabledOnReservationFee?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isMenuBrowsingEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAppOrderEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isDeliveryEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPickupOrderEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isScheduledOrderEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isReservationEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isWaitingEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isDeliveryToCarEnabled?: boolean;

  @ApiProperty({ type: DefaultWorkingHoursDTO, required: false })
  @ValidateNested({ each: true })
  @Type(() => DefaultWorkingHoursDTO)
  @IsOptional()
  defaultWorkingHours?: DefaultWorkingHoursDTO;

  @ApiProperty({ type: [IndividualWorkHoursDTO], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndividualWorkHoursDTO)
  @IsOptional()
  overrideWorkingHours?: IndividualWorkHoursDTO[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  customerAuthForDeliveryOrder?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  customerAuthForPickupOrder?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  customerAuthForDineInOrder?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  customerAuthForTableActivities?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  acceptTip?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isSmallRestaurant?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isLargeKitchenReceipt?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  canBeDeferred?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  massInvoice?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  feeRate?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  createTestData?: boolean;

  @ApiProperty({ required: false, type: [MarketPlacesDto] })
  @ValidateNested({ each: true })
  @Type(() => MarketPlacesDto)
  @IsOptional()
  marketPlaces?: MarketPlacesDto[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  themeColor?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isVendor?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isRestaurant?: boolean;

  @ApiProperty({ required: false, type: String })
  @IsEnum(Language)
  @IsOptional()
  kitchenReceiptLanguage?: Language;

  @ApiProperty({ required: false, type: String })
  @IsEnum(Language)
  @IsOptional()
  cashierReceiptLanguage?: Language;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  tobaccoFeeInvoices?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  disableAutoCashierPrint?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  disableAutoCashierReceiptPrint?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  disableAutoKitchenReceiptPrint?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferSaleGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferExpenseGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferPurchaseGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferGoodsReceiptGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferInvoiceReceiptGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferWasteEventGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferStockTransferGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferRecipeProductionGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferSalesGoodsGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferInventoryCountGl?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  applyAccountingOnPayment?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoTransferPriceChange?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  stockInventoryNotification?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoPng?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  backgroundImagePng?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isMaster?: boolean;
}

export class UpdateSupplierDto extends PartialType(AddSupplierDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  active: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  iswhatsappOpted: boolean;
}

export class UpdateSupplierMarket {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  value: boolean;
}

export class UpdateSupplierMarketPlacesDto {
  @ApiProperty({ required: false, type: [UpdateSupplierMarket] })
  @ValidateNested({ each: true })
  @Type(() => UpdateSupplierMarket)
  @IsNotEmpty()
  marketPlaces?: UpdateSupplierMarket[];
}

export class AssignPackageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  packageId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  startTrial?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
  @IsDate()
  @MinDate(new Date(moment.utc().format('YYYY-MM-DD')), {
    message:
      'minimal allowed date for startDate is ' + new Date().toDateString(),
  })
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  deliveryMargin?: number;
}

export class ModifyPackageFeaturesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  features: string[];
}

export class SupplierQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({ required: false })
  @ToBoolean()
  @IsOptional()
  isVendor: boolean;

  @ApiProperty({ required: false })
  @ToBoolean()
  @IsOptional()
  isRestaurant: boolean;
}

export class VendoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email: string;
}
