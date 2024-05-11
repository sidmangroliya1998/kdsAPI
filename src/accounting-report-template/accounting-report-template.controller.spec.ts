import { Test, TestingModule } from '@nestjs/testing';
import { AccountingReportTemplateController } from './accounting-report-template.controller';
import { AccountingReportTemplateService } from './accounting-report-template.service';

describe('AccountingReportTemplateController', () => {
  let controller: AccountingReportTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountingReportTemplateController],
      providers: [AccountingReportTemplateService],
    }).compile();

    controller = module.get<AccountingReportTemplateController>(AccountingReportTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
