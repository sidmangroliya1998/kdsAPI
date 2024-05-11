import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import * as moment from 'moment';
import { ToBoolean } from 'src/core/Helpers/custom.validators';

export class QueryGlVoucherDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  voucherNumber: string;

  @ApiProperty({ type: String, required: false })
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  @IsOptional()
  startDate: any;

  @ApiProperty({ type: String, required: false })
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  @IsOptional()
  endDate: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  documentType: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  costCenter: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  segment: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  purpose: string;

  @ApiProperty({ required: false })
  @IsOptional()
  minAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxAmount: number;
}
