import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsNotEmpty, IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';
import { DebtDocType, DebtType, TransStatus, DebtPaymentStatus } from 'src/core/Constants/enum';
import { PaymentType } from '../enum/en';

export class CreateDebtEmpDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    restaurantId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMongoId()
    cashierLogId: string;

    @ApiProperty()
    @IsOptional()
    @IsMongoId()
    empId: string;

    @IsOptional()
    @IsNotEmpty()
    @ApiProperty()
    date: Date;

    @IsOptional()
    @IsString()
    @ApiProperty()
    referenceNumber: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    attachment: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    notes: string;

    @ApiProperty({ type: String, enum: DebtType, enumName: 'DebtType' })
    @IsNotEmpty()
    @IsEnum(DebtType)
    debtType: DebtType;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({ required: true })
    totalAmount: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    totalPaid: number;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ default: false })
    isDebtReversal: Boolean;

    @ApiProperty({ type: String, enum: TransStatus, enumName: 'TransStatus' })
    @IsOptional()
    @IsEnum(TransStatus)
    transType: TransStatus;

    @ApiProperty()
    @IsOptional()
    @IsMongoId()
    referenceEmpDebtId: string;

    @ApiProperty()
    @IsOptional()
    otherGLAccount: string;

    @ApiProperty({ type: String, enum: PaymentType, enumName: 'PaymentType' })
    @IsEnum(PaymentType)
    @IsIn([PaymentType.Card, PaymentType.Cash, PaymentType.Other])
    paymentType: PaymentType;

    @ApiProperty()
    @IsOptional()
    @IsMongoId()
    supplierId: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty()
    remainCost: number;

    @ApiProperty({ type: String, enum: DebtPaymentStatus, enumName: 'DebtPaymentStatus' })
    @IsOptional()
    @IsEnum(DebtPaymentStatus)
    paymentStatus: DebtPaymentStatus;

    @ApiProperty()
    @IsOptional()
    @IsMongoId()
    addedBy: string;

}
