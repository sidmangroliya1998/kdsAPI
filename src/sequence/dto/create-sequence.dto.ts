import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ObjectType } from '../enum/en';
export class CreateSequenceDto {
    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsString({
        message: i18nValidationMessage('validation.MUST_BE_STRING'),
    })
    sequenceValue: string;
    
    @ApiProperty({
        type: String,
        enum: ObjectType,
        enumName: 'ObjectType',
    })
    @IsEnum(ObjectType, {
        message: i18nValidationMessage('validation.MUST_BE_ENUM'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    objectType: ObjectType;
}