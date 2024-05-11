import { Test, TestingModule } from '@nestjs/testing';
import { ManualCustomerPaymentController } from './manual-customer-payment.controller';
import { ManualCustomerPaymentService } from './manual-customer-payment.service';

describe('ManualCustomerPaymentController', () => {
  let controller: ManualCustomerPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualCustomerPaymentController],
      providers: [ManualCustomerPaymentService],
    }).compile();

    controller = module.get<ManualCustomerPaymentController>(ManualCustomerPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
