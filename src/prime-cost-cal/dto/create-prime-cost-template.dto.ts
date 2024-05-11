import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsNumber,
    IsMongoId,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';



export class SalesGroupDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    code: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty({ required: false })
    indent: number;

    @ApiProperty({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    glAccountIds: string[];

    @IsOptional()
    @IsArray()
    @ApiProperty({ required: false, isArray: true, type: SalesGroupDto })
    @Type(() => SalesGroupDto)
    @ValidateNested({ each: true })
    children: SalesGroupDto[];
}

export class CogsGroupDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty({ required: false })
    indent: number;

    @ApiProperty({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    glAccountIds: string[];

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    salesGroupId: string;

    @IsOptional()
    @IsArray()
    @ApiProperty({ required: false, isArray: true, type: CogsGroupDto })
    @Type(() => CogsGroupDto)
    @ValidateNested({ each: true })
    children: CogsGroupDto[];
}


export class LaborGroupDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty({ required: false })
    indent: number;

    @ApiProperty({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    glAccountIds: string[];

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    salesGroupId: string;

    @IsOptional()
    @IsArray()
    @ApiProperty({ required: false, isArray: true, type: LaborGroupDto })
    @Type(() => LaborGroupDto)
    @ValidateNested({ each: true })
    children: LaborGroupDto[];
}

export class CreatePrimeCostTemplateDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [SalesGroupDto] })
    @Type(() => SalesGroupDto)
    @ValidateNested({ each: true })
    salesGroup: SalesGroupDto[];

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [CogsGroupDto] })
    @Type(() => CogsGroupDto)
    @ValidateNested({ each: true })
    cogsGroup: CogsGroupDto[];

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [LaborGroupDto] })
    @Type(() => LaborGroupDto)
    @ValidateNested({ each: true })
    laborGroup: LaborGroupDto[];
}
