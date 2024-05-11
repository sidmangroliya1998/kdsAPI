import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray
} from 'class-validator';
import { ToBoolean } from 'src/core/Helpers/custom.validators';
import { Transform, Type } from 'class-transformer';
export class QueryMenuCategoryDto {
  @ApiProperty({ required: false })
  @ToBoolean()
  @IsOptional()
  fetchCategoriesHavingItems: boolean;

  // @ApiProperty({ required: false })
  // @IsOptional()
  // // @IsArray()
  // @IsMongoId()
  // //@Type(() => String)
  // //@Transform(({ value }) => value.toString().split(','))
  // restaurantId: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  restaurantId: string;
}
