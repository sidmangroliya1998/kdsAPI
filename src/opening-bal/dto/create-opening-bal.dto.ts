import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsDate,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import * as moment from 'moment';
import { Transform, Type } from 'class-transformer';
import { CreateOpeningBalItemDto } from './create-opening-bal-item.dto';

export class CreateOpeningBalDto {
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

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    glAccountId: string;

    @ApiProperty()
    @IsOptional()
    description: string;

    @ApiProperty()
    @IsOptional()
    descriptionAr: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    totalCost: number;

    @ApiProperty({ type: [CreateOpeningBalItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOpeningBalItemDto)
    @IsNotEmpty()
    items: CreateOpeningBalItemDto[];

}