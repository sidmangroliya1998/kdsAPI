import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import * as moment from 'moment';
import { TaxIndication } from 'src/expense/enum/en';

export class ManualItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  expense: string;

  @ApiProperty({ required: false })
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
    },
  )
  tax: number;

  @ApiProperty({ type: String, enum: TaxIndication, enumName: 'TaxIndication' })
  @IsNotEmpty()
  @IsEnum(TaxIndication)
  taxIndication: TaxIndication;

  net?: number;
}
