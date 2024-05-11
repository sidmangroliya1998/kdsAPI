import { PartialType } from '@nestjs/swagger';
import { CreateGlTaxIndicationDto } from './create-gl-tax-indication.dto';

export class UpdateGlTaxIndicationDto extends PartialType(CreateGlTaxIndicationDto) { }
