
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsArray, IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TransStatus } from 'src/core/Constants/enum';
import { OrderItemDto } from 'src/order/dto/order-item.dto';
import { Transform, Type } from 'class-transformer';

export class CreateEmpMealDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    empId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ type: [] })
    @IsArray()
    @IsNotEmpty()
    items: any[];

    @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus', default: TransStatus.Draft })
    @IsOptional()
    @IsEnum(TransStatus)
    transType: TransStatus;

}