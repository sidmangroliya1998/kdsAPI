
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsIn,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { CreateGlVoucherItemDto } from './create-gl-voucher-item.dto';

import * as moment from 'moment';
import { GLTransStatus, IntervalType } from '../enum/en.enum';

export class SpecificDateDto {
    @ApiProperty({ description: 'Day of the month', minimum: 1, maximum: 31 })
    @IsNumber()
    day: number;

    @ApiProperty({ description: 'Month of the year', minimum: 1, maximum: 12 })
    @IsNumber()
    month: number;
}

export class TriggerDto {
    @ApiProperty({ description: 'Type of trigger', enum: IntervalType, default: IntervalType.Monthly })
    @IsNotEmpty()
    @IsEnum(IntervalType)
    intervalType: IntervalType;

    @ApiProperty({ description: 'Interval between task executions', required: false })
    @IsNotEmpty()
    @IsNumber()
    interval?: number;

    @ApiProperty({ description: 'Days of the week for weekly triggers', required: false })
    @IsOptional()
    @IsArray()
    @IsEnum([0, 1, 2, 3, 4, 5, 6], { each: true })
    daysOfWeek?: number[];

    @ApiProperty({ description: 'Days of the month for monthly triggers', required: false, type: [Number], minimum: 1, maximum: 31 })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    daysOfMonth?: number[];

    @ApiProperty({ description: 'Specific dates for yearly triggers', required: false, type: [SpecificDateDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SpecificDateDto)
    specificDate?: SpecificDateDto[];
}

export class CreateGlVoucherRecurringDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

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
    startDate: Date;

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
    endDate: Date;

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

    @ApiProperty({ description: 'Trigger settings of the task' })
    @ValidateNested()
    @Type(() => TriggerDto)
    trigger: TriggerDto;

    @ApiProperty({ type: [CreateGlVoucherItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateGlVoucherItemDto)
    @IsNotEmpty()
    items: CreateGlVoucherItemDto[];

    @ApiProperty({
        type: String,
        enum: GLTransStatus, enumName: 'GLTransStatus',
        default: GLTransStatus.Approved
    })
    @IsOptional()
    @IsEnum(GLTransStatus)
    transStatus?: GLTransStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsMongoId()
    vendorId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    vendorName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    attachment?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    referenceNumber?: string;
}