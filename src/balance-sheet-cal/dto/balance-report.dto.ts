
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsMongoId,
    IsOptional,
    isMongoId, IsEnum
} from 'class-validator';
import * as moment from 'moment';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';
import { ReportType } from 'src/profit-loss-cal/enum/en';
export class BalanceSheetReportDto {

    @ApiProperty({ required: false })
    @IsOptional()
    @ShouldBeBefore('endDate')
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
    @ShouldBeAfter('startDate')
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


    @IsOptional()
    @ApiProperty({
        required: false,
        type: String,
        enum: ReportType,
        enumName: 'ReportType',
    })
    @IsEnum(ReportType)
    timeFlag?: ReportType;
}
