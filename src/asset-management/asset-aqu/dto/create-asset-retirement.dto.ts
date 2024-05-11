import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsIn,
    IsMongoId,
    IsNotEmpty,
    IsNotIn,
    IsOptional,
    IsString,
    ValidateNested,
    IsNumber
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAssetRetirementDto {

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsMongoId()
    assetAquId: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    description: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    descriptionAr: string;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)
                    .format('YYYY-MM-DD')
            ))
    @IsDate({
        message: i18nValidationMessage('validation.MUST_BE_DATE')
    })
    date: Date;

    @ApiProperty({ required: true })
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)
                    .format('YYYY-MM-DD')
            ))
    @IsDate({
        message: i18nValidationMessage('validation.MUST_BE_DATE')
    })
    retirementDate: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    aquisitionAmount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    accumlatedAmount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    nbvAmount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    depreciationAmount: number;
}
