import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class OptionDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  optionId: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @IsOptional()
  perItemQuantity: number;
}

class MenuAdditionDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  menuAdditionId: string;

  @ApiProperty({ type: [OptionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @IsOptional()
  options: OptionDto[];
}

class MenuItemDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  menuItemId: string;
}
export class OrderItemDto {
  @ApiProperty({ type: MenuItemDto })
  @ValidateNested()
  @Type(() => MenuItemDto)
  @IsNotEmpty()
  menuItem: MenuItemDto;

  @ApiProperty({ type: [MenuAdditionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuAdditionDto)
  @IsOptional()
  additions?: MenuAdditionDto[];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  promotionalItemId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

class BundleMenuItemDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  menuItemId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [MenuAdditionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuAdditionDto)
  @IsOptional()
  additions?: MenuAdditionDto[];
}

class BundleSubGrpupDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  bundleSubGroupId: string;

  @ApiProperty({ type: [BundleMenuItemDto] })
  @ValidateNested()
  @Type(() => BundleMenuItemDto)
  @IsNotEmpty()
  items: BundleMenuItemDto[];

  @ApiProperty({ type: [MenuAdditionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuAdditionDto)
  @IsOptional()
  additions?: MenuAdditionDto[];
}
export class BundleItemDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  tempbundleId?: string;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  bundleId: string;

  @ApiProperty({ type: [BundleSubGrpupDto] })
  @ValidateNested()
  @Type(() => BundleSubGrpupDto)
  @IsNotEmpty()
  bundleSubGroups: BundleSubGrpupDto[];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
