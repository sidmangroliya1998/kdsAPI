import { PartialType } from '@nestjs/swagger';
import { CreateGlMaterialCodeDto } from './create-gl-material-code.dto';

export class UpdateGlMaterialCodeDto extends PartialType(CreateGlMaterialCodeDto) {}
