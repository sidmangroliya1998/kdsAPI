import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsOptional,
    IsDate,
    IsNotEmpty,
    IsMongoId
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as moment from 'moment';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateDeleteProcessDto {
    @ApiProperty()
    @IsNotEmpty({
        message: i18nValidationMessage('validation.NOT_EMPTY'),
    })
    @IsMongoId({
        message: i18nValidationMessage('validation.MUST_BE_MONGO_ID'),
    })
    supplierId: string;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isGLVoucher?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isExpenses?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isPurchases?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isOrder?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isPO?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isProdEvent?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isWasteEvent?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isStockTransfer?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isInventory?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isInventoryHistory?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isVendorInvoice?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isVendorPayment?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isCustomerInvoice?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isCustomerPayment?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isAssetMaster?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isAssetAquTrans?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isAssetDep?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isAssetRetirement?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isResetCOA?: boolean;

    @ApiProperty({ required: false , default:false})
    @IsBoolean()
    @IsOptional()
    isResetPrimeCost?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isResetProfitLoss?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isResetBalanceSheet?: boolean;

    @ApiProperty({ required: false, default:false })
    @IsBoolean()
    @IsOptional()
    isMaterial?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
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

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isAllTime?: boolean;
}