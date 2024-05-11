import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsDate,
    IsMongoId
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import * as moment from 'moment';
import { Transform, Type } from 'class-transformer';

export class CreatePaymentFeesDto {

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
    paymentDate: Date;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    restaurantId: string;

    @ApiProperty({ required: true })
    @IsNumber()
    @IsNotEmpty()
    madaCard: number;

    @ApiProperty({ required: true })
    @IsNumber()
    @IsNotEmpty()
    visaMaster: number;

    @ApiProperty({ required: true })
    @IsNumber()
    @IsNotEmpty()
    americalExpress: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    glAccountIdBank: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    glAccountIdFees: string;
}