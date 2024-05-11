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

import { TaxIndication } from 'src/expense/enum/en';

export class CreatePurchaseLineItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  category: string;

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
