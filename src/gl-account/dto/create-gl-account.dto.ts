import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean
} from 'class-validator';

export class CreateGlAccountDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAccountGroupId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  nameAr: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  glNumber: number;

  
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isApplicableForPayment: boolean;
}
