
import { ApiProperty } from '@nestjs/swagger';
import {   
    IsOptional,
    IsString,
    IsBoolean
} from 'class-validator';
export class CreateTrainingDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    groupName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    groupNameAr?: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    nameAr: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    description: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    descriptionAr: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    videoURL: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    videoURLAr: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    imageURL: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    isActive: boolean;
}
