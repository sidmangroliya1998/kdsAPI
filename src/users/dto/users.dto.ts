import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsUrl,
  IsArray,
  IsBoolean,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';

import { Role } from 'src/role/schemas/roles.schema';
import { Transform } from 'class-transformer';
import { ToBoolean } from 'src/core/Helpers/custom.validators';

export class UserCreateDto {
  @ApiProperty({ required: false, default: null })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @ApiProperty({ required: false })
  email?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  role?: Role;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value.replace('+', ''))
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  kitchenQueue?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  tableRegion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  cashier?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isWaiter?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDriver?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  avatar?: string;


  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  restaurantId?: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  defaultRestaurant?: string;


  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

}

export class UserUpdateDto extends PartialType(
  OmitType(UserCreateDto, ['email', 'password'] as const),
) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefaultWaiter?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  expoToken?: string;
}

export class ImpersonateSupplierDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  supplierId: string;
}

export class QueryUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @ToBoolean()
  isDriver?: boolean;
}
