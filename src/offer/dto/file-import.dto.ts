import { ApiProperty } from '@nestjs/swagger';

export class FileImportProcessDto {

    @ApiProperty({ type: String, format: 'binary' })
    file: any;

}
