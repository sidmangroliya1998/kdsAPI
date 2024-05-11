import { PartialType } from '@nestjs/swagger';
import { CreateBalanceSheetTemplateDto } from './create-balance-sheet-template.dto';

export class UpdateBalanceSheetTemplateDto extends PartialType(CreateBalanceSheetTemplateDto) { }
