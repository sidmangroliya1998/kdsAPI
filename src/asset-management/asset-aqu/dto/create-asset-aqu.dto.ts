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
    IsNumber,
    IsBoolean
} from 'class-validator';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAssetAquDto {
    @IsNotEmpty()
    @IsMongoId()
    @ApiProperty({ required: true })
    restaurantId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ required: true })
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({ required: true })
    lifeSpanNo: number;

    
    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)

                    .format('YYYY-MM-DD'),
            ),
    )
    // @IsDate({
    //     message: i18nValidationMessage('validation.MUST_BE_DATE')
    // })
    aquisitionDate: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)

                    .format('YYYY-MM-DD'),
            ),
    )
   
    depreciationDate: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)

                    .format('YYYY-MM-DD'),
            ),
    )
    
    retirementDate: Date;

    @IsOptional()
    @IsNumber()
    @ApiProperty({ required: false })
    acquisitionValue: Number;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    glAssetCategoryId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsBoolean()
    isRetired: boolean;
}
