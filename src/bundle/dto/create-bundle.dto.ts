import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  IsMongoId
} from 'class-validator';
import * as moment from 'moment';
import { SubGroupDto } from './sub-group.dto';

class ValidTime {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  endTime: string;
}
class OfferValidityDto {
  @ApiProperty()
  @IsNotEmpty()
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

  @ApiProperty()
  @IsNotEmpty()
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

  @ApiProperty({ type: ValidTime, required: false })
  @IsOptional()
  @Type(() => ValidTime)
  @ValidateNested()
  validTime: ValidTime;
}

export class CreateBundleDto {  

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
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  descriptionAr: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  image: string;

  @ApiProperty({ type: [SubGroupDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubGroupDto)
  subGroups: SubGroupDto[];

  @ApiProperty({ type: OfferValidityDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfferValidityDto)
  offerValidity: OfferValidityDto;

  @ApiProperty({})
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  availableRestaurants?: string[];
}
