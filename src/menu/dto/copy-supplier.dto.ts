import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsMongoId,
    IsNotEmpty,
    IsOptional,
    IsArray
} from 'class-validator';

export class copySupplierDTO {
    @ApiProperty({ required: true })
    @IsOptional()
    @IsMongoId()
    fromSupplier ?: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsMongoId()
    toSupplier ?: string;

    @ApiProperty({ required: true, type: [String] })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    menuItemIds?: string[];
}
