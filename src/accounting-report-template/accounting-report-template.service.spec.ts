import { Test, TestingModule } from '@nestjs/testing';
import { AccountingReportTemplateService } from './accounting-report-template.service';

describe('AccountingReportTemplateService', () => {
  let service: AccountingReportTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountingReportTemplateService],
    }).compile();

    service = module.get<AccountingReportTemplateService>(AccountingReportTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
