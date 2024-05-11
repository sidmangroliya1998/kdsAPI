
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsMongoId,
    IsOptional,
    isMongoId,
    IsString, IsEnum
} from 'class-validator';
import * as moment from 'moment';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';
import { ReportType } from '../enum/en';
export class ProfitLossReportDto {

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
