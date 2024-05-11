import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

export class ReportDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  reportingYear: number[];

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  reportingPeriodStart: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  reportingPeriodEnd: number;

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  comparingYear: number[];

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  comparingPeriodStart: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  comparingPeriodEnd: number;

  glAccountIds?: GlAccountDocument[];
}

export class SimplifiedReportDto {
  year: number[];
  periodStart: number;
  periodEnd: number;
  glAccountIds?: GlAccountDocument[];
}
