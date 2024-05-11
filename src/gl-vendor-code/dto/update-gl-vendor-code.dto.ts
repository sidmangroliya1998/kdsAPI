import { PartialType } from '@nestjs/swagger';
import { CreateGlVendorCodeDto } from './create-gl-vendor-code.dto';

export class UpdateGlVendorCodeDto extends PartialType(CreateGlVendorCodeDto) {}
