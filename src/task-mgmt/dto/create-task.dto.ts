import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileURL: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  taskType?: string;  
  
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  totalTax?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  totalNet?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  referenceDocId?: string;

  @ApiProperty()
  @IsOptional()
  docObject?: any;
}