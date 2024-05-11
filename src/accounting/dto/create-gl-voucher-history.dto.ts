import { ApiProperty } from '@nestjs/swagger';
import {
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';


export class CreateGlVoucherHistoryDto {

    @ApiProperty({ required: false })
    @IsNotEmpty()
    @IsMongoId()
    voucherId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsMongoId()
    voucherHistoryId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

}
