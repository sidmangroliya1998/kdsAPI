import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGlTaxIndicationDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({ required: true, default: 0 })
    rate: number;
}
