import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsEnum
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import * as moment from 'moment';
import { InventoryCountVariationStatus } from '../enum/en';

class ManualCountDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  quantity: number;

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  uom: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  storage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  baseQuantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  variationQuantity: number;

  @ApiProperty({
    type: String, enum: InventoryCountVariationStatus,
    enumName: 'InventoryCountVariationStatus',
    required: false
  })
  @IsEnum(InventoryCountVariationStatus)
  @IsOptional()
  variationStatus: string;


  uomBuy?: string;
  purchaseQty?: number;
  variationQuantityPurchase?: number;

}

export class InventoryCountItemDto {
  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  materialId: string;

  @ApiProperty({ type: [ManualCountDto] })
  @IsArray({
    message: i18nValidationMessage('validation.MUST_BE_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => ManualCountDto)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  count: ManualCountDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(
    ({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD HH:MM')),
  )
  @IsDate()
  expirationDate?: Date;

  countValue?: number; //New Stock Value = after applied base Quantity
  totalCount?: number; // New Stock Counts = after applied base Quantity **

  onHandCount?: number; // Old Count Base UoM = Before applied
  onHandCountValue?: number; // Old Value Base UoM = Before applied
  onHandPurchaseValue?: number; // Old Value Base UoM = Before applied
  onHandPurchaseCount?: number; // Old Count with Purchase UoM **
  newPurchaseCount?: number; // New Count with Purchase UoM **

  variationQuantity?: number; // Quantity Difference after applied base UoM
  variationStatus?: string;  // Variation Status

  differentialCount?: number;  // ABS Difference (new - old)
  differentialCountValue?: number;  // ABS Value (new - old)

  variationQuantityPurchase?: number; // Quantity Difference after applied Purchase UoM **

  uomBase?: string;



}
