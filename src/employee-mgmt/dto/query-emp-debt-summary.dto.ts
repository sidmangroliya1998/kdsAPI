import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsMongoId, IsOptional ,IsString } from 'class-validator';
import {
  OrderStatus,
  OrderPaymentStatus,
  OrderType,
  DeliveryStatus,
} from 'src/order/enum/en.enum';
import { Transform, Type } from 'class-transformer';
import * as moment from 'moment';
import { ShouldBeBeforeNow } from 'src/core/Validators/ShouldBeBeforeNow.validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';
import { DebtDocType, DebtPaymentStatus, DebtType, TransStatus } from 'src/core/Constants/enum';
import { PaymentMethod } from 'src/payment/enum/en.enum';

export class EmpDebtSummaryDto {

    @ApiProperty({ type: String ,  required: false,})
    @IsMongoId()
    @IsOptional()
    empId: any;


    // @ApiProperty({ type: Number ,required: false, })
    // @IsOptional()
    // minAmount:number

    // @ApiProperty({ type: Number , required: false,})
    // @IsOptional()
    // maxAmount:number


    @ApiProperty({ required: false })
    @IsOptional()
    @ShouldBeBefore('endDate')
    @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
    @IsDate()
    startDate: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @ShouldBeBeforeNow()
    @ShouldBeAfter('startDate')
    @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
    @IsDate()
    endDate: Date;

    
    @ApiProperty({ required: false })
    @IsMongoId()
    @IsOptional()
    restaurantId: string;

    @ApiProperty({
      required: false,
      type: String,
      enum: DebtType,
      enumName: 'DebtType',
    })
    @IsOptional()
    @IsEnum(DebtType)
    debtType: DebtType;

    @ApiProperty({
      required: false,
      type: String,
      enum: TransStatus,
      enumName: 'TransStatus',
    })
    @IsOptional()
    @IsEnum(TransStatus)
    transType: TransStatus;

    @ApiProperty({
      required: false,
      type: String,
      enum: PaymentMethod,
      enumName: 'PaymentMethod',
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentType: PaymentMethod;
}

export class EmpDebtFindAllDto {

  @ApiProperty({ type: String ,  required: false,})
  @IsMongoId()
  @IsOptional()
  empId: any;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  restaurantId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
      required: false,
      type: String,
      enum: DebtType,
      enumName: 'DebtType',
  })
  @IsOptional()
  @IsEnum(DebtType)
  debtType: DebtType;

  @ApiProperty({ required: false })
  @IsOptional()
  minAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxAmount: number;

  @ApiProperty({
    required: false,
    type: String,
    enum: TransStatus,
    enumName: 'TransStatus',
  })
  @IsOptional()
  @IsEnum(TransStatus)
  transType: TransStatus;

  @ApiProperty({
    required: false,
    type: String,
    enum: DebtDocType,
    enumName: 'DebtDocType',
  })
  @IsOptional()
  @IsEnum(DebtDocType)
  docType: DebtDocType;

  @ApiProperty({
    required: false,
    type: String,
    enum: PaymentMethod,
    enumName: 'PaymentMethod',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentType: PaymentMethod;

  @ApiProperty({
    required: false,
    type: String,
    enum: DebtPaymentStatus,
    enumName: 'DebtPaymentStatus',
  })
  @IsOptional()
  @IsEnum(DebtPaymentStatus)
  paymentStatus: DebtPaymentStatus;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  addedBy: string;


  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeBefore('endDate')
  @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
  @IsDate()
  startDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeBeforeNow()
  @ShouldBeAfter('startDate')
  @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
  @IsDate()
  endDate: Date;
}
