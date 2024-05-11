import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId
} from 'class-validator';
import { ListType } from 'src/core/Constants/enum';

export class CreateListDto {
  @IsNotEmpty()
  @ApiProperty({ type: String, enum: ListType, enumName: 'ListType' })
  @IsEnum(ListType)
  type: ListType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  nameAr: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  availableRestaurants?: string[];
}
