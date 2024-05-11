import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNumber,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class CardOptionDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    madaCard: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    visaMaster: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    americalExpress: number;
}

export class CreatePaymentBankFeesDto {
    @ApiProperty({ type: CardOptionDto })
    @Type(() => CardOptionDto)
    @ValidateNested()
    @IsNotEmpty()
    bankFees: CardOptionDto;

    @ApiProperty({ type: CardOptionDto })
    @Type(() => CardOptionDto)
    @ValidateNested()
    @IsNotEmpty()
    alRajhiBank: CardOptionDto;

    @ApiProperty({ type: CardOptionDto })
    @Type(() => CardOptionDto)
    @ValidateNested()
    @IsNotEmpty()
    clickPayBank: CardOptionDto;

    @ApiProperty({ type: CardOptionDto })
    @Type(() => CardOptionDto)
    @ValidateNested()
    @IsNotEmpty()
    nearPay: CardOptionDto;
}