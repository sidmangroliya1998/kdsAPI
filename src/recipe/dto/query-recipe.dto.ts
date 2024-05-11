import { BaseQueryDto } from 'src/core/dto/base-query.dto';
import { restaurantId } from '../../../test1/constants/test.constant';
import { ApiProduces, ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class QueryRecipeDto extends BaseQueryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  @IsOptional()  
  restaurantId: string;
}

export class SingleRecipeQueryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  restaurantId: string;
}
