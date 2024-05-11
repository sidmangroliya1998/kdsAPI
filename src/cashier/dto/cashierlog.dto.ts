import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested, IsBoolean, IsEnum
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PrintAction } from 'src/core/Constants/enum';

export class CashierLogPrintDto {
    @ApiProperty({ type: String, enum: PrintAction, enumName: 'PrintAction', default: PrintAction.Print })
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsEnum(PrintAction)
    action: string;

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsString()
    lang: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    to: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    cc: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    emailbody: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    emailSubject: string;

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    cashierLogId: string;
}