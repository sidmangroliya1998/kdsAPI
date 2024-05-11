import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,IsBoolean, IsEnum
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MaterialItemDto } from 'src/purchase-order/dto/item.dto';
import { ManualItemDto } from './item.dto';
import { TransStatus } from 'src/core/Constants/enum';

export class CreateManualVendorInvoiceDto {
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
  vendorId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  purchaseOrderId: string;

  @ApiProperty({ type: [ManualItemDto] })
  @IsArray({
    message: i18nValidationMessage('validation.MUST_BE_ARRAY'),
  })
  @ValidateNested({ each: true })
  @Type(() => ManualItemDto)
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  items: ManualItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  text: string;

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

  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isReturn: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  referenceVI: string;

  @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
  @IsOptional()
  @IsEnum(TransStatus)
  transType: TransStatus;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isIncludingPayment?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  payFrom?: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  otherGLAccount?: string;
}
