import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, ValidateIf } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { BulkImportType } from '../enum/bulk-import.enum';

export class ImportProcessDto {
  @ApiProperty({ type: String, enum: BulkImportType, enumName: 'BulkImportType' })
  @IsEnum(BulkImportType)
  @IsNotEmpty()
  type: BulkImportType;

  @ApiProperty({ type: String, format: 'binary' })
  file: any;

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  supplierId: string;

  @ApiProperty()
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsMongoId({
    message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
  })
  restaurantId: string;
}
