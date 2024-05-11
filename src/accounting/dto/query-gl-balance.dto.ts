import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import * as moment from 'moment';

export class QueryGlBalanceDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    glAccountId: string;

    @ApiProperty({ type: String, required: false })
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)

                    .format('YYYY-MM-DD'),
            ),
    )
    @IsDate()
    @IsOptional()
    startDate: any;

    @ApiProperty({ type: String, required: false })
    @Transform(
        ({ value }) =>
            new Date(
                moment
                    .utc(value)

                    .format('YYYY-MM-DD'),
            ),
    )
    @IsDate()
    @IsOptional()
    endDate: any;
}