import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';
import { RefInvoiceType } from '../enum/en.enum';
import { TransStatus } from 'src/core/Constants/enum';

class RefInvoiceDto {
  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  invoiceId: string;

  @ApiProperty({
    type: String,
    enum: RefInvoiceType,
    enumName: 'RefInvoiceType',
  })
  @IsEnum(RefInvoiceType)
  @IsNotEmpty()
  type: RefInvoiceType;
}
export class CreateManualCustomerPaymentDto {
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
  customerId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  purchaseOrderId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()  
  payFrom?: string;

  @ApiProperty({ type: [RefInvoiceDto] })
  @Type(() => RefInvoiceDto)
  @ValidateNested({ each: true })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  invoices: RefInvoiceDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.NOT_BE_STRING') })
  text: string;

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
  amount: number;

  @ApiProperty({ type: [String] })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsArray()
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.NOT_BE_STRING'),
  })
  items: string[];

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

  @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
  @IsOptional()
  @IsEnum(TransStatus)
  transType: TransStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()  
  paymentType?: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  otherGLAccount: string;
}
