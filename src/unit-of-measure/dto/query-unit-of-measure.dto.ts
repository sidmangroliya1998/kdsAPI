import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsMongoId, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class QueryUnitOfMeasureDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.MUST_BE_STRING'),
  })
  filter: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  restaurantId: string;
}
