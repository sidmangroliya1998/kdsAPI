import { PartialType } from '@nestjs/swagger';
import { CreateTranslateEditorDto } from './create-translateEditor.dto';

export class UpdateTranslateEditorDto extends PartialType(CreateTranslateEditorDto) {}

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
export class UpdateTranslateEditorDtoTwo {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  moduleName: string;

  @ApiProperty({ type: String, format: 'binary' ,required : false })
  arFile: any;

  @ApiProperty({ type: String, format: 'binary' ,required : false })
  enFile: any;
}