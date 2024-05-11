import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsNotEmpty, IsMongoId, IsArray, ValidateNested, IsEnum, IsIn, IsDate } from 'class-validator';
import { PaymentType } from '../enum/en';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Transform, Type } from 'class-transformer';

class EmpMonthlyTimeSheetItemDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    empId: string;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    amount: number;
}

export class QueryPayRollDto {

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

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    monthNumber: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    yearNumber: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    totalAmount: number;

    @ApiProperty({ type: String, enum: PaymentType, enumName: 'PaymentType' })
    @IsNotEmpty()
    @IsEnum(PaymentType)
    @IsIn([PaymentType.Bank, PaymentType.Cash, PaymentType.Other])
    paymentType: PaymentType;

    @ApiProperty()
    @IsOptional()
    @IsMongoId()
    glAccountId?: string;

    @ApiProperty({ type: [EmpMonthlyTimeSheetItemDto], required: true })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmpMonthlyTimeSheetItemDto)
    timeSheetDetails: EmpMonthlyTimeSheetItemDto[];

}
