import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBundleDto } from './create-bundle.dto';
import { SubGroupDto } from './sub-group.dto';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateSubGroupDto extends SubGroupDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  _id: string;
}

export class UpdateBundleDto extends PartialType(CreateBundleDto) {
  @ApiProperty({ type: [UpdateSubGroupDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubGroupDto)
  subGroups?: UpdateSubGroupDto[];
}
