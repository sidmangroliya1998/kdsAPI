import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class StartTableLogDto {
    @ApiProperty({ required: false })    
    @IsOptional()
    guestCount?: number;
}