import { Test, TestingModule } from '@nestjs/testing';
import { ManualCustomerPaymentService } from './manual-customer-payment.service';

describe('ManualCustomerPaymentService', () => {
  let service: ManualCustomerPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualCustomerPaymentService],
    }).compile();

    service = module.get<ManualCustomerPaymentService>(ManualCustomerPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
