import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsEnum, IsString
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { Transform, Type } from 'class-transformer';
import { MaterialItemDto } from 'src/purchase-order/dto/item.dto';
import * as moment from 'moment';
import { TaxIndication } from 'src/expense/enum/en';
import { TransStatus } from 'src/core/Constants/enum';

export class CreateGoodsReceiptDto {
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
  purchaseOrderId: string;

  @ApiProperty({ type: [MaterialItemDto] })
  @IsArray({
    message: i18nValidationMessage('validation.MUST_BE_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => MaterialItemDto)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  items: MaterialItemDto[];

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate({
    message: i18nValidationMessage('validation.MUST_BE_DATE'),
  })
  date: Date;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  additionalCost: number;

  @ApiProperty({ type: String, enum: TaxIndication, enumName: 'TaxIndication' })
  @IsNotEmpty()
  @IsEnum(TaxIndication)
  taxIndication: TaxIndication;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  isReturn: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  attachment?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
  @IsOptional()
  @IsEnum(TransStatus)
  transType: TransStatus;
}
