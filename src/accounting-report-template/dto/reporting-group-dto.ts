import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OperationType } from '../enum/en.enum';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AggregateDto {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({ type: [Number] })
  groupOrders: number[];

  @IsNotEmpty()
  @ApiProperty({ type: String, enum: OperationType, enumName: 'OperationType' })
  @IsEnum(OperationType)
  operation: OperationType;
}

export class ReportingGroupDto {
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
  startOfGroup: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  endOfGroup: string;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({ required: false })
  glAccountSetId: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  order: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  bold: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  negativeNature: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  highlight: boolean;

  indent: number;

  @IsOptional()
  @ApiProperty({ required: false, type: AggregateDto })
  @Type(() => AggregateDto)
  @ValidateNested({ each: true })
  aggregate: AggregateDto;

  @IsOptional()
  @IsArray()
  @ApiProperty({ required: false, isArray: true, type: ReportingGroupDto })
  @Type(() => ReportingGroupDto)
  @ValidateNested({ each: true })
  children: ReportingGroupDto[];
}
