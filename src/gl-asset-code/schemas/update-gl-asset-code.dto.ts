import { PartialType } from '@nestjs/swagger';
import { CreateGlAssetCodeDto } from '../dto/create-gl-asset-code.dto';

export class UpdateGlAssetCodeDto extends PartialType(CreateGlAssetCodeDto) { }
