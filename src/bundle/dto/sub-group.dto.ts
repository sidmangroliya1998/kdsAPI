import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubGroupDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  nameAr: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  additionPricingIncluded: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAllowedQuantities: number;

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  items: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  additions: string[];
}
