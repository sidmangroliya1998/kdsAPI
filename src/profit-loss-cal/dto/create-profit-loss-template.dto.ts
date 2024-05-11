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

export class ProfitLossSalesGroupDto {
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
}

export class ProfitLossCogsGroupDto {
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
    @ApiProperty({ required: false, isArray: true, type: ProfitLossCogsGroupDto })
    @Type(() => ProfitLossCogsGroupDto)
    @ValidateNested({ each: true })
    children: ProfitLossCogsGroupDto[];

}

export class ProfitLossLaborGroupDto {
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
}

export class ProfitLossControllableExpenseDto {
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
}

export class ProfitLossNonControllableExpenseDto {
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
}

export class ProfitLossOtherDto {
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
}

export class CreateProfitLossTemplateDto {
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
    @ApiProperty({ type: [ProfitLossSalesGroupDto] })
    @Type(() => ProfitLossSalesGroupDto)
    @ValidateNested({ each: true })
    profitLossSalesGroup: ProfitLossSalesGroupDto[];

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [ProfitLossCogsGroupDto] })
    @Type(() => ProfitLossCogsGroupDto)
    @ValidateNested({ each: true })
    profitLossCogsGroup: ProfitLossCogsGroupDto[];

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [ProfitLossLaborGroupDto] })
    @Type(() => ProfitLossLaborGroupDto)
    @ValidateNested({ each: true })
    profitLossLaborGroup: ProfitLossLaborGroupDto[];


    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [ProfitLossControllableExpenseDto] })
    @Type(() => ProfitLossControllableExpenseDto)
    @ValidateNested({ each: true })
    profitLossControllableExpense: ProfitLossControllableExpenseDto[];


    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [ProfitLossNonControllableExpenseDto] })
    @Type(() => ProfitLossNonControllableExpenseDto)
    @ValidateNested({ each: true })
    profitLossNonControllableExpense: ProfitLossNonControllableExpenseDto[];

    @IsNotEmpty()
    @IsArray()
    @ApiProperty({ type: [ProfitLossOtherDto] })
    @Type(() => ProfitLossOtherDto)
    @ValidateNested({ each: true })
    profitLossOther: ProfitLossOtherDto[];
}
