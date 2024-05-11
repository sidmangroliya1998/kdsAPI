import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsArray, IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EmployeePayPlan, EmployeeType } from '../enum/en';

export class CreateEmpDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    address: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    phone: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    idProof: string;

    @ApiProperty({ type: String, enum: EmployeePayPlan, enumName: 'EmployeePayPlan' })
    @IsNotEmpty()
    @IsEnum(EmployeePayPlan)
    payPlan: EmployeePayPlan;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    hourlyRate: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    monthlySalary: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    benefitMarkup: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    weeklyWorkingDays: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    monthlyWorkingDays: number;

    @IsOptional()
    @IsString()
    @ApiProperty()
    employementDay: Date;

    @IsOptional()
    @IsString()
    @ApiProperty()
    releaseDate: Date;

    @ApiProperty({ type: String, enum: EmployeeType, enumName: 'EmployeeType' })
    @IsNotEmpty()
    @IsEnum(EmployeeType)
    employeeType: EmployeeType;
}
