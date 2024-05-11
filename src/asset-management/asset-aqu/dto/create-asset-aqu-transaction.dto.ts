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
import { TaxIndication } from 'src/expense/enum/en';
import { PaymentMethod } from 'src/payment/enum/en.enum';

export class CreateAssetAquTransactionDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    assetAquId: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsMongoId()
    vendorId: string;

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

    @ApiProperty({ type: String, enum: PaymentMethod, enumName: 'PaymentMethod' })
    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    @IsIn([PaymentMethod.Card, PaymentMethod.Cash, , PaymentMethod.Credit, PaymentMethod.Other])
    paymentType: PaymentMethod;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    grossAmount: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tax: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty({ type: String, enum: TaxIndication, enumName: 'TaxIndication' })
    @IsNotEmpty()
    @IsEnum(TaxIndication)
    taxIndication: TaxIndication;

    @ApiProperty()
    @IsOptional()
    @IsString()
    glAccountId: string;

    net?: number;
}
