
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

export class CurrentAssetDto {
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
    @ApiProperty({ required: false, isArray: true, type: CurrentAssetDto })
    @Type(() => CurrentAssetDto)
    @ValidateNested({ each: true })
    children: CurrentAssetDto[];
}

export class FixedAssetDto {
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
    @ApiProperty({ required: false, isArray: true, type: FixedAssetDto })
    @Type(() => FixedAssetDto)
    @ValidateNested({ each: true })
    children: FixedAssetDto[];
}

export class AssetsDto {

    @ApiProperty({ required: false })
    @IsNotEmpty()
    currentAsset: CurrentAssetDto;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    fixedAsset: FixedAssetDto;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    indent: number;
}

export class LiabilitiesDto {
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
    @ApiProperty({ required: false, isArray: true, type: LiabilitiesDto })
    @Type(() => LiabilitiesDto)
    @ValidateNested({ each: true })
    children: LiabilitiesDto[];
}

export class EquityDto {
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
    @ApiProperty({ required: false, isArray: true, type: EquityDto })
    @Type(() => EquityDto)
    @ValidateNested({ each: true })
    children: EquityDto[];
}

export class LiabilityAndEquityDto {

    @ApiProperty({ required: false })
    @IsNotEmpty()
    liabilities: LiabilitiesDto;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    equity: EquityDto;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    indent: number;
}

export class CreateBalanceSheetTemplateDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    nameAr: string;

    @IsNotEmpty()
    @ApiProperty({ type: AssetsDto })
    @Type(() => AssetsDto)
    assets: AssetsDto;

    @IsNotEmpty()
    @ApiProperty({ type: LiabilityAndEquityDto })
    @Type(() => LiabilityAndEquityDto)
    liabilityAndEquity: LiabilityAndEquityDto;
}
