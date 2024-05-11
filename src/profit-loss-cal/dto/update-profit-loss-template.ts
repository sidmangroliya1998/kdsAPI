import { PartialType } from '@nestjs/swagger';
import { CreateProfitLossTemplateDto } from './create-profit-loss-template.dto';

export class UpdateProfitLossTemplateDto extends PartialType(CreateProfitLossTemplateDto) { }
