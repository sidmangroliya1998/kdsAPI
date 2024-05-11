import { PartialType } from '@nestjs/swagger';
import { CreateGlAssetCodeDto } from './create-gl-asset-code.dto';

export class UpdateGlAssetCodeDto extends PartialType(CreateGlAssetCodeDto) { }
