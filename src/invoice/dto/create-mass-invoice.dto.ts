import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType } from '../invoice.enum';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNotIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
  isBoolean,
} from 'class-validator';
import { CalculationType } from 'src/core/Constants/enum';
import { QueryOrderDto } from 'src/order/dto/query-order.dto';

export class CreateMassInvoiceDto extends QueryOrderDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty({ required: false, type: String, enum: CalculationType })
  @IsEnum(CalculationType)
  @ValidateIf((o) => o.amount)
  @IsNotEmpty()
  amountType: CalculationType;

  @ApiProperty({
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  orderIds: string[];
}

export class ReduceShishaTaxAndMassInvoiceDto extends QueryOrderDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  shishaTaxToReduce: number;

  @ApiProperty({ type: String, enum: CalculationType })
  @IsEnum(CalculationType)
  @IsNotEmpty()
  amountType: CalculationType;

  @ApiProperty({
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  orderIds: string[];
}
