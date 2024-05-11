import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray
} from 'class-validator';
import * as moment from 'moment';
import { ToBoolean } from 'src/core/Helpers/custom.validators';
import { Type } from 'class-transformer';

export class OpenCashierDto {
  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsMongoId()
  restaurantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  cashierId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image: string;
}
export class CloseCashierDashboardDto {

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalRemianingAmountToCollect?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalRefunds?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalSales?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salesPaidWithCash?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salesPaidWithCard?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  expectedCashAtClose?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  deferredAmount?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  expenseAmount?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  tip?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  cashDifference?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  cardDifference?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalDifference?: number;

  @ApiProperty()
  @IsNumber()
  enteredCashAmount?: number;

  @ApiProperty()
  @IsNumber()
  enteredCardAmount?: number;

  @ApiProperty()
  @IsNumber()
  salesPaidWithHungerStation?: number;

  @ApiProperty()
  @IsNumber()
  salesPaidWithJahezSales?: number;

  @ApiProperty()
  @IsNumber()
  salesPaidWithToyoSales?: number;

  @ApiProperty()
  @IsNumber()
  salesPaidWithOtherSales?: number; 

  @ApiProperty()
  @IsNumber()
  enteredVisaAmount?: number;

  @ApiProperty()
  @IsNumber()
  enteredMadaAmount?: number;
}

export class CloseCashierDto extends OmitType(OpenCashierDto, [
  'openingBalance',
] as const) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  closingBalance: number;

  @IsNotEmpty()
  @ApiProperty({ type: CloseCashierDashboardDto })
  @Type(() => CloseCashierDashboardDto)
  closeCashierDashboard: CloseCashierDashboardDto;

  overrideReason?: string;
}

export class OverrideCloseCashierDto extends CloseCashierDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  overrideReason: string;
}

export class QueryCashierLogDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => new Date(moment.utc(value).format('YYYY-MM-DD')))
  @IsDate()
  createdAt: Date;
}

export class QueryCashierDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.toString().split(','))
  restaurantId: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @ToBoolean()
  includeOrders?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @ToBoolean()
  activeCashiers?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @ToBoolean()
  nonActiveCashiers?: boolean;
}

export class ExpenseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expenseNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  expense: number;
}
