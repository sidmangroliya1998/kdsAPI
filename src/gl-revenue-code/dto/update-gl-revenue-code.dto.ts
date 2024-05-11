import { PartialType } from '@nestjs/swagger';
import { CreateGlRevenueCodeDto } from './create-gl-revenue-code.dto';

export class UpdateGlRevenueCodeDto extends PartialType(CreateGlRevenueCodeDto) { }
