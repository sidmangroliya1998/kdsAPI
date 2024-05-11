import { GlLineType } from "src/accounting/enum/en.enum";
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber
} from 'class-validator';

export class CreateOpeningBalItemDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    glAccountId: string;

    @ApiProperty({ type: String, enum: GlLineType, enumName: 'GlLineType' })
    @IsNotEmpty()
    @IsEnum(GlLineType)
    glLineType: GlLineType;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;
}