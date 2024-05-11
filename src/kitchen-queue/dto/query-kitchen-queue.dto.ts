import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
export class QueryKitchenQueueDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  restaurantId: string[];

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  userId: string;
}
