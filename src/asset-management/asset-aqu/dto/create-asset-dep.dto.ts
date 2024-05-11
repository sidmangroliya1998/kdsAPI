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

class CreateAssetAquDepLineItemDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    assetAquId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;
}

export class CreateAssetAquDepDto {

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    description: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    descriptionAr: string;
 
    @ApiProperty({ required: false })
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
        message: i18nValidationMessage('validation.MUST_BE_DATE')
    })
    date: Date;
    
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsNumber()
    monthNumber: number;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsNumber()
    yearNumber: number;

    @ApiProperty({ type: [CreateAssetAquDepLineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAssetAquDepLineItemDto)
    @IsNotEmpty()
    items: CreateAssetAquDepLineItemDto[];
}
