import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';
import * as moment from 'moment';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';

export class CashierReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  restaurantId: string;

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
}

export class CashierLogReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  restaurantId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  cashierId: string;
}
