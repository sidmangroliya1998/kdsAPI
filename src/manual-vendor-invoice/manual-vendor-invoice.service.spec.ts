import { Test, TestingModule } from '@nestjs/testing';
import { ManualVendorInvoiceService } from './manual-vendor-invoice.service';

describe('ManualVendorInvoiceService', () => {
  let service: ManualVendorInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualVendorInvoiceService],
    }).compile();

    service = module.get<ManualVendorInvoiceService>(ManualVendorInvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
