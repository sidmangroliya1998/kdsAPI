import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsDate,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsString,
    IsArray, ValidateNested,
    IsOptional,
    IsEnum
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TransStatus } from 'src/core/Constants/enum';

export class WasteEventNewItemDto {
    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    materialId: string;

    @ApiProperty({ example: 1 })
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @Type()
    @IsNumber(
        {},
        {
            message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
        },
    )
    quantity: number;

    @ApiProperty({})
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    uom: string;
}

export class CreateWasteEventNewDto {
    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    restaurantId: string;

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    reason: string;

    @ApiProperty({ type: [WasteEventNewItemDto] })
    @IsArray({
        message: i18nValidationMessage('validation.MUST_BE_ARRAY'),
    })
    @ValidateNested({ each: true })
    @Type(() => WasteEventNewItemDto)
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    items: WasteEventNewItemDto[];

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)
                    .format('YYYY-MM-DD'),
            ),
    )
    @IsDate({
        message: i18nValidationMessage('validation.MUST_BE_DATE'),
    })
    date: Date;

    @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
    @IsOptional()
    @IsEnum(TransStatus)
    transType: TransStatus;
}
