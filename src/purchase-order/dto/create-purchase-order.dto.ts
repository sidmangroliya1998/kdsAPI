import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsString,
  IsNumber
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MaterialItemDto } from './item.dto';
import { Transform, Type } from 'class-transformer';
import * as moment from 'moment';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { TaxIndication } from 'src/expense/enum/en';
import { TransStatus } from 'src/core/Constants/enum';

export class CreatePurchaseOrderDto {
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

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  isSimplified: boolean;

  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
    enum: PaymentMethod,
    enumName: 'PaymentMethod'
  })
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  attachment?: string[];

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  otherGLAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceNumber: string;

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
  @IsBoolean()
  isReturn: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  referencePO?: string;

  @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
  @IsOptional()
  @IsEnum(TransStatus)
  transType: TransStatus;
}
