import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    ValidateNested,
    IsString,
    IsEnum
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TransferRequestStatus } from '../enum/en';

export class TransferInventoryReqItemDto {   

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    materialId: string;

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsNumber(
        {},
        {
            message: i18nValidationMessage('validation.MUST_BE_NUMBER'),
        },
    )
    stock: number;

    @ApiProperty({})
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    uom: string;
}

export class TransferInventoryRequestDto {
    
    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    sourceRestaurantId: string;

    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    targetRestaurantId: string;

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

    @ApiProperty({ type: [TransferInventoryReqItemDto] })
    @IsArray({
        message: i18nValidationMessage('validation.MUST_BE_ARRAY'),
    })
    @ValidateNested({ each: true })
    @Type(() => TransferInventoryReqItemDto)
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    items: TransferInventoryReqItemDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    attachment?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    referenceNumber?: string;
}