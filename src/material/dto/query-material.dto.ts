import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ToBoolean } from 'src/core/Helpers/custom.validators';

export class QueryMaterialDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.MUST_BE_STRING'),
  })
  filter: string;


}

export const MatUomUpdate = {
  materialId: 'A',
  uomId: 'B'
};
