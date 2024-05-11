import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class TrialBalanceReportDto {
  @ApiProperty({})
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  year: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  periodStart: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  periodEnd: number;
}
