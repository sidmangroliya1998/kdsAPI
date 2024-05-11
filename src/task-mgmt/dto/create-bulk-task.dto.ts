import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min, IsArray
} from 'class-validator';

export class CreateBulkTaskDto {
    @ApiProperty()
    @IsMongoId()
    @IsNotEmpty()
    restaurantId: string;

    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    fileURLs: string[];
}

export class CreateBulkApprovalDto{
    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    taskIds: string[];
}