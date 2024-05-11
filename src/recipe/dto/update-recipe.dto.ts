import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRecipeDto } from './create-recipe.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean({
    message: i18nValidationMessage('validation.MUST_BE_BOOLEAN'),
  })
  active: boolean;
}
