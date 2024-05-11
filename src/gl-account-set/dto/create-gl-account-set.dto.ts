import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsOptional,IsString } from 'class-validator';

export class CreateGlAccountSetDto {
  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  glAccountIds: string[];

  @ApiProperty({})
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({})
  @IsOptional()
  @IsString()
  nameAr: string;
}
