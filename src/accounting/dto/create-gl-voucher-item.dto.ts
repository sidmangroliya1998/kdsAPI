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
import { GlLineType } from '../enum/en.enum';
import { ListDocument } from 'src/list/schemas/list.schema';

export class CreateGlVoucherItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAccountId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: String, enum: GlLineType, enumName: 'GlLineType' })
  @IsNotEmpty()
  @IsEnum(GlLineType)
  glLineType: GlLineType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: ListDocument;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: ListDocument;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: ListDocument;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  glTaxIndicationId?: string;
  
  partnerRestaurantId?;
}
