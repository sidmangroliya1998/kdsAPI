import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class PurchaseCategoryMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  category: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}

class MappingDetailDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  glAccount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}

class GlVenCodeMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glVenCodeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}


class GlRevenueCodeMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glRevenueCodeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}


class GlAssetCodeMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAssetCodeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  assetAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  depreciationExpenseAccount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  accumulatedAccount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  retirementLossAccount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}

class GlTaxIndicationCodeDto {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  glTaxIndicationId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}

class GlMaterialCodesMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  glMatCodeId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  invengtoryGlAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  grirGlAccount: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  costCenter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  segment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  purpose?: string;
}

export class CreateGlAccountMappingDto {
  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  cash: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  bank: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  card: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  online: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  softPos: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  deferred: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  accountReceivable: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  crRevenue: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  crShishaTax: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  crOutputTax: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  drInputTax: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  wasteExpense: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  sfInterCompany: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  cogsAccount: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  taxClearing: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  gainAndLoss: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  avgPriceChange: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  salaryExpense: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  salaryAccural: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  employeeExpense: MappingDetailDto;
  
  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  consumptionGlAccount: MappingDetailDto;

  @ApiProperty({ type: MappingDetailDto, required: false })
  @ValidateNested()
  @Type(() => MappingDetailDto)
  @IsOptional()
  customerAccountReceivables: MappingDetailDto;

  @ApiProperty({ type: [PurchaseCategoryMappingDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseCategoryMappingDto)
  @IsOptional()
  purchaseCategories: PurchaseCategoryMappingDto[];

  @ApiProperty({ type: [GlMaterialCodesMappingDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlMaterialCodesMappingDto)
  @IsOptional()
  materialCodes: GlMaterialCodesMappingDto[];

  @ApiProperty({ type: [GlVenCodeMappingDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlVenCodeMappingDto)
  @IsOptional()
  glVenCodes: GlVenCodeMappingDto[];

  @ApiProperty({ type: [GlRevenueCodeMappingDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlRevenueCodeMappingDto)
  @IsOptional()
  glRevenueCodes: GlRevenueCodeMappingDto[];

  @ApiProperty({ type: [GlAssetCodeMappingDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlAssetCodeMappingDto)
  @IsOptional()
  glAssetCodes: GlAssetCodeMappingDto[];

  @ApiProperty({ type: [GlTaxIndicationCodeDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlTaxIndicationCodeDto)
  @IsOptional()
  glTaxIndicationCodes: GlTaxIndicationCodeDto[];
  
}
