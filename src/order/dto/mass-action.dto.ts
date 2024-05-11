import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { CalculationType } from 'src/core/Constants/enum';

export class MassActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  orderIds: string[];
}

export class MassCancelDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty({ required: false, type: String, enum: CalculationType })
  @IsEnum(CalculationType)
  @ValidateIf((o) => o.amount)
  @IsNotEmpty()
  amountType: CalculationType;

  @ApiProperty({
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  orderIds: string[];
}
