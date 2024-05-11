import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ReportingGroupDto } from './reporting-group-dto';
import { Type } from 'class-transformer';

export class CreateAccountingReportTemplateDto {
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
  @ApiProperty({ type: [ReportingGroupDto] })
  @Type(() => ReportingGroupDto)
  @ValidateNested({ each: true })
  reportingGroup: ReportingGroupDto[];
}
