import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsMongoId, IsOptional } from 'class-validator';
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

export class DriverSummaryDto {

    @ApiProperty({ type: String ,  required: false,})
    @IsMongoId()
    @IsOptional()
    driverId: any;

    @ApiProperty({
        required: false,
        type: String,
        enum: DeliveryStatus,
        enumName: 'DeliveryStatus',
    })
    @IsOptional()
    @IsEnum(DeliveryStatus)
    deliveryStatus: DeliveryStatus;

    @ApiProperty({ type: Number ,required: false, })
    @IsOptional()
    minAmount:number

    @ApiProperty({ type: Number , required: false,})
    @IsOptional()
    maxAmount:number


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
