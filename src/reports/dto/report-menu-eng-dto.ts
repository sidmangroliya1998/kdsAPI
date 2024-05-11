import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsArray, IsMongoId, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as moment from 'moment';
import { ShouldBeBeforeNow } from 'src/core/Validators/ShouldBeBeforeNow.validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';

export class ReportMenuEngineerDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
    @IsDate()
    startDate: Date;
  
    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
    @IsDate()
    endDate: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    restaurantIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds: string[];
}