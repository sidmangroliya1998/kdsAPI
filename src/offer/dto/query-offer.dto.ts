import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsDate } from 'class-validator';
import { ApplicationType, OfferType } from '../enum/en.enum';
import { CalculationType } from 'src/core/Constants/enum';
import { ToBoolean } from 'src/core/Helpers/custom.validators';
import { Transform, Type } from 'class-transformer';
import * as moment from 'moment';

export class QueryOfferDto {
  @ApiProperty({ type: String, enum: OfferType, enumName: 'OfferType' })
  @IsNotEmpty()
  @IsEnum(OfferType)
  offerType: OfferType;

  @ApiProperty({
    type: String,
    enum: ApplicationType,
    enumName: 'ApplicationType',
    required: false,
  })
  @IsOptional()
  @IsEnum(ApplicationType)
  applicationType: ApplicationType;

  @IsOptional()
  @IsEnum(CalculationType)
  discountType: CalculationType;

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

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  @ApiProperty({ required: false })
  active: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  @IsMongoId({ each: true })
  menuItemIds: string[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  @IsMongoId({ each: true })
  menuCategoryIds: string[];
}
