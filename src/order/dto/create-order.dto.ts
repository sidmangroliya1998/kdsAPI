import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinDate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OrderType, Source, MarketType } from '../enum/en.enum';
import { Transform, Type } from 'class-transformer';
import * as moment from 'moment';
import { BundleItemDto, OrderItemDto } from './order-item.dto';
import { LocationDto } from 'src/restaurant/dto/create-restaurant.dto';

export class DeliveryAddressDto extends OmitType(LocationDto, [
  'country',
] as const) {}

export class CreateOrderDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.orderType == OrderType.DineIn && !o.skipTableValidation)
  @IsMongoId()
  @IsNotEmpty()
  tableId?: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  waiterId?: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  kitchenQueueId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiProperty({ type: String, enum: Source, enumName: 'Source' })
  @IsEnum(Source)
  @IsNotEmpty()
  source: Source;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  marketPlaceType?: string;

  @ApiProperty({ type: String, enum: OrderType, enumName: 'OrderType' })
  @IsEnum(OrderType)
  @IsNotEmpty()
  orderType: OrderType;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateIf((o) => !o.bundles || o.bundles.length == 0)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @ApiProperty({ type: [BundleItemDto], required: false })
  @IsArray()
  @ValidateIf((o) => !o.items || o.items.length == 0 || o.bundles?.length > 0)
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  @IsNotEmpty()
  bundles?: BundleItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.isScheduled)
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date(), {
    message:
      'minimal allowed date for scheduledDate is ' + new Date().toISOString(),
  })
  scheduledDateTime?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(
    ({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD HH:MM')),
  )
  @IsDate()
  menuQrCodeScannedTime?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  pager?: string;

  @ApiProperty({ required: false, type: DeliveryAddressDto })
  @ValidateIf((o) => o.orderType == OrderType.Delivery)
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsNotEmpty()
  deliveryAddress?: DeliveryAddressDto;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paymentType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  marketPlaceAggregatorId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  feedusId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  guests?: number;

  createdAt?: Date;

  skipTableValidation?: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isEmployeeMeal?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  date?: Date;
}
