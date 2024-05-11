import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import * as moment from 'moment';
import { GLTransStatus, GlVoucherType } from '../enum/en.enum';
import { CreateGlVoucherItemDto } from './create-gl-voucher-item.dto';

export class CreateGlVoucherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  restaurantId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  vendorId?: string;

  purchaseOrderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceDocNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: String, enum: GlVoucherType, enumName: 'GlVoucherType' })
  @IsNotEmpty()
  @IsEnum(GlVoucherType)
  @IsNotIn([GlVoucherType.ManualJEReversal])
  type: GlVoucherType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachment?: string;

  @ApiProperty({ type: [CreateGlVoucherItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGlVoucherItemDto)
  @IsNotEmpty()
  items: CreateGlVoucherItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)
          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  date: Date;

  @ApiProperty({ type: String, 
    enum: GLTransStatus, enumName: 'GLTransStatus',
     default: GLTransStatus.Approved })
  @IsOptional()
  @IsEnum(GLTransStatus)
  transStatus?: GLTransStatus;

  reversedVoucherId?: string; 
}
