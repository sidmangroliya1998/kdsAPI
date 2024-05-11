import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { PaymentMethod } from 'src/payment/enum/en.enum';
import { TaxIndication } from '../enum/en';

export class CreateExpenseLineItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  purpose: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note: string;

  @ApiProperty({ type: String, enum: TaxIndication, enumName: 'TaxIndication' })
  @IsNotEmpty()
  @IsEnum(TaxIndication)
  taxIndication: TaxIndication;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  grossAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tax: number;

  net?: number;
}
