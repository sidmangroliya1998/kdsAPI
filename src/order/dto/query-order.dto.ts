import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,IsNumber
} from 'class-validator';
import {
  OrderStatus,
  OrderPaymentStatus,
  OrderType,
  DeliveryStatus,
  InvoiceStatus,
} from '../enum/en.enum';
import { Transform, Type } from 'class-transformer';
import { ToBoolean } from 'src/core/Helpers/custom.validators';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';
import * as moment from 'moment';
import { PaymentMethod } from 'src/payment/enum/en.enum';

export class QueryOrderDto {
  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  restaurantId: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  tableId: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  driverId: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  customerId: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  waiterId: string;

  @ApiProperty({ required: false })
  @ToBoolean()
  @IsOptional()
  notBelongingToTable: boolean;

  @ApiProperty({
    required: false,
    type: String,
    example: 'Pending,Not Paid',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  paymentStatus: OrderPaymentStatus[];

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  cashierLogIds: string[];

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  menuItemIds: string[];

  @ApiProperty({
    required: false,
    enum: OrderType,
    enumName: 'OrderType',
  })
  @IsEnum(OrderType)
  @IsOptional()
  orderType: OrderType;

  @IsOptional()
  @ApiProperty({ required: false })
  @ToBoolean()
  @IsBoolean()
  @Type(() => Boolean)
  isInvoiced: boolean;

  @ApiProperty({ required: false, type: String, example: 'New,Processing' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  status: OrderStatus[];

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  deliveryStatus: DeliveryStatus[];

  @ApiProperty({ required: false, example: false })
  @ToBoolean()
  @IsOptional()
  chefRequestedClarification: boolean;

  @ApiProperty({ required: false, example: false })
  @ToBoolean()
  @IsOptional()
  trasferredToGl: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  filter: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeBefore('endDate')
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  startDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeAfter('startDate')
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  endDate: Date;

  @ApiProperty({
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  orderIds: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  groupId: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  @Type(() => String)
  paymentMethod: PaymentMethod;
}

export class QueryCustomerOrderDto extends QueryOrderDto {
  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  supplierId: string;
}

export class QueryKitchenDisplayDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  restaurantId: string;
}

export class QueryManualShishaUpdateDto {
  @ApiProperty({ required: true })
  @IsMongoId()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeBefore('endDate')
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  startDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @ShouldBeAfter('startDate')
  @Transform(
    ({ value }) =>
      new Date(
        moment
          .utc(value)

          .format('YYYY-MM-DD'),
      ),
  )
  @IsDate()
  endDate: Date;

}


export class RemoveCashOrder extends QueryOrderDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  removeCashAmount: number;
}