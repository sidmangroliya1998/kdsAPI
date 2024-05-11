import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsArray, IsNumber, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class EmpHourlyItemDataDto {

    @ApiProperty()
    @IsNotEmpty()
    timeSheetDate: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    hourAmount: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    hourCost: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    hourTotal: number;
}

class EmpHourlyItemDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    empId: string;

    @ApiProperty({ type: [EmpHourlyItemDataDto], required: true })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmpHourlyItemDataDto)
    timeSheetDetailsItemData: EmpHourlyItemDataDto[];
}


export class CreateEmpHourlyTimeSheetDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @ApiProperty()
    @IsNotEmpty()
    weekStartDate: Date;

    @ApiProperty({ type: [EmpHourlyItemDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EmpHourlyItemDto)
    @IsOptional()
    timeSheetDetails: EmpHourlyItemDto[];
}



