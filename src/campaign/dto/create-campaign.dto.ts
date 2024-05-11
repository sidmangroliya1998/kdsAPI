import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({})
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({})
  @IsOptional()
  @IsString()
  nameAr: string;

  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  media: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phoneNumbers: string[];

  @ApiProperty()
  @IsNotEmpty()
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format(),
      ),
  )
  @IsDate()
  scheduledAt: Date;
}
