import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsDate, IsNumber, IsOptional, IsArray, } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import * as moment from 'moment';
import { Transform } from 'class-transformer';
import { ShouldBeAfter } from 'src/core/Validators/ShouldBeAfter.validator';
import { ShouldBeBefore } from 'src/core/Validators/ShouldBeBefore.validator';

export class ItemConsumptionDto {

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    restaurantIds: string[];

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


    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    materialIds: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    menuItemIds: string[];
}
