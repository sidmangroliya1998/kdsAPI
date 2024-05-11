import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DeliveryAddressDto } from 'src/order/dto/create-order.dto';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  @ApiProperty({ required: false })
  email?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  vatNumber?: string;

  @ApiProperty({ required: false, type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @IsOptional()
  deliveryAddress?: DeliveryAddressDto;
}
