import { Test, TestingModule } from '@nestjs/testing';
import { ManualVendorPaymentController } from './manual-vendor-payment.controller';
import { ManualVendorPaymentService } from './manual-vendor-payment.service';

describe('ManualVendorPaymentController', () => {
  let controller: ManualVendorPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualVendorPaymentController],
      providers: [ManualVendorPaymentService],
    }).compile();

    controller = module.get<ManualVendorPaymentController>(ManualVendorPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
