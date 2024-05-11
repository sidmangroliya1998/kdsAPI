import { Test, TestingModule } from '@nestjs/testing';
import { ManualCustomerInvoiceService } from './manual-customer-invoice.service';

describe('ManualCustomerInvoiceService', () => {
  let service: ManualCustomerInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualCustomerInvoiceService],
    }).compile();

    service = module.get<ManualCustomerInvoiceService>(ManualCustomerInvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
