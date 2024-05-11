import { PartialType } from '@nestjs/swagger';
import { CreateAccountingReportTemplateDto } from './create-accounting-report-template.dto';

export class UpdateAccountingReportTemplateDto extends PartialType(CreateAccountingReportTemplateDto) {}
