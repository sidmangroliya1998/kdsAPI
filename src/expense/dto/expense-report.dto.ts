import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsMongoId, IsOptional,Min } from 'class-validator';
import * as moment from 'moment';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';

export class ExpenseReportDto {
  @ApiProperty({
    required: false,

    type: String,
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  @IsMongoId({ each: true })
  restaurantIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeBefore('endDate')
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  startDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeAfter('startDate')
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  endDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  minAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  vendorId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  createdBy: string;
}
