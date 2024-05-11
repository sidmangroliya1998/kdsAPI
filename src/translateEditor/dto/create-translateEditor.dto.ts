import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsMongoId, IsOptional ,IsString, IsNotEmpty} from 'class-validator';
import { TranslateEditorModuleName } from 'src/core/Constants/enum';


export class CreateTranslateEditorDto {

    @ApiProperty({
        required: false,
        type: String,
        enum: TranslateEditorModuleName,
        enumName: 'TranslateEditorModuleName',
        default: TranslateEditorModuleName.Accounting
    })
    @IsOptional()
    @IsEnum(TranslateEditorModuleName)
    moduleName: TranslateEditorModuleName;


    @ApiProperty({ type: String, format: 'binary' ,required : false })
    @IsNotEmpty()
    enFile: any;

    @ApiProperty({ type: String, format: 'binary' ,required : false })
    @IsNotEmpty()
    arFile: any;

}


