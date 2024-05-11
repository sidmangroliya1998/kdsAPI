import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RestaurantMaterialDto {
  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  restaurantId: string;

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  materialId: string;

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  minStockLevel: number;

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  parLevel: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false, default: 0 })
  overridePrice: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isForSale: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isForDailyCount: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  maxStockLevel: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  maxLevelUoM: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  allowedVendors?: string[];

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  maxCeilingPrice: number;
}
