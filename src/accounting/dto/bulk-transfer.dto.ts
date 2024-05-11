import { ApiProperty } from '@nestjs/swagger';
import { GlVoucherType } from '../enum/en.enum';
import { IsArray, IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class BulkTransferDto {
  @ApiProperty({ type: String, enum: GlVoucherType, enumName: 'GlVoucherType' })
  @IsEnum(GlVoucherType)
  @IsNotEmpty()
  //@IsIn([GlVoucherType.Expense, GlVoucherType.Purchase, GlVoucherType.Sales])
  type: GlVoucherType;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  objectIds: string[];
}
