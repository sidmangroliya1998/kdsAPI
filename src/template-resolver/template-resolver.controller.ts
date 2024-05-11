import { Controller } from '@nestjs/common';
import { TemplateResolverService } from './template-resolver.service';

@Controller('template-resolver')
export class TemplateResolverController {
  constructor(private readonly templateResolverService: TemplateResolverService) {}
}
