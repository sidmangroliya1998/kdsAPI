import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { OrderItemDto } from './order-item.dto';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNotIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DeliveryStatus,
  MarketPlaceStatus,
  OrderStatus,
} from '../enum/en.enum';

export class UpdateOrderItemDto extends OrderItemDto {
  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  _id: string;
}
export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['items', 'tableId'] as const),
) {
  @ApiProperty({ type: [UpdateOrderItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];

  status?: OrderStatus;

  @ApiProperty({
    type: String,
    enum: DeliveryStatus,
    required: false,
    enumName: 'DeliveryStatus',
  })
  @IsEnum(DeliveryStatus)
  @IsOptional()
  deliveryStatus?: DeliveryStatus;

  orderItemIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  chefRequestedClarification?: boolean;

  tip?: number;

  groupId?: string;

  tableId?: string;

  mergedAt?: Date;
  
  mergedBy?: string;
}

export class ChangeOrderDto {
  @ApiProperty({ type: [UpdateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsNotEmpty()
  items: UpdateOrderItemDto[];
}

export class ChangeTableDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  tableId: string;
}

export class TipDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  tip: number;
}

export class MarketPlaceStatusDto {
  @ApiProperty({
    type: String,
    enum: MarketPlaceStatus,
    enumName: 'MarketPlaceStatus',
  })
  @IsNotEmpty()
  @IsEnum(MarketPlaceStatus)
  marketPlaceStatus: MarketPlaceStatus;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.marketPlaceStatus == MarketPlaceStatus.Rejected)
  @IsNotEmpty()
  @IsString()
  marketPlaceReason?: string;
}
