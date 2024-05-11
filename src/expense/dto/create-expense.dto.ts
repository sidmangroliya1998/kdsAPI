import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { PaymentMethod } from 'src/payment/enum/en.enum';
import { CreateExpenseLineItemDto } from './create-expense-line-item.dto';
import * as moment from 'moment';
import { TransStatus } from 'src/core/Constants/enum';

class AdhocVendor {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber: string;
}
export class CreateExpenseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  restaurantId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  details: string;

  @ApiProperty({ type: String, enum: PaymentMethod, enumName: 'PaymentMethod' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  @IsIn([PaymentMethod.Card, PaymentMethod.Cash, PaymentMethod.Other])
  paymentType: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receipt: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherDocs: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  vendorId: string;

  @ApiProperty({ type: AdhocVendor, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdhocVendor)
  adhocVendor: AdhocVendor;

  @ApiProperty({ type: [CreateExpenseLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseLineItemDto)
  @IsNotEmpty()
  items: CreateExpenseLineItemDto[];

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

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  otherGLAccount: string;

  @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
  @IsOptional()
  @IsEnum(TransStatus)
  transType: TransStatus;
}
