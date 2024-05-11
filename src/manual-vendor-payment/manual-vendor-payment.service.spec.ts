import { Test, TestingModule } from '@nestjs/testing';
import { ManualVendorPaymentService } from './manual-vendor-payment.service';

describe('ManualVendorPaymentService', () => {
  let service: ManualVendorPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualVendorPaymentService],
    }).compile();

    service = module.get<ManualVendorPaymentService>(ManualVendorPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
