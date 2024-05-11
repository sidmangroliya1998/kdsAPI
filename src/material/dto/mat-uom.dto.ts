import { ApiProperty } from '@nestjs/swagger';

export class ImportMatDto {

    @ApiProperty({ type: String, format: 'binary' })
    file: any;
}
