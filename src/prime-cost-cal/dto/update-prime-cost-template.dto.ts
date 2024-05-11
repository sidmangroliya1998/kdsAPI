import { PartialType } from '@nestjs/swagger';
import { CreatePrimeCostTemplateDto } from './create-prime-cost-template.dto';

export class UpdatePrimeCostTemplateDto extends PartialType(CreatePrimeCostTemplateDto) { }
