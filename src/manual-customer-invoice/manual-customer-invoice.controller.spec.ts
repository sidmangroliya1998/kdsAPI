import { Test, TestingModule } from '@nestjs/testing';
import { ManualCustomerInvoiceController } from './manual-customer-invoice.controller';
import { ManualCustomerInvoiceService } from './manual-customer-invoice.service';

describe('ManualCustomerInvoiceController', () => {
  let controller: ManualCustomerInvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualCustomerInvoiceController],
      providers: [ManualCustomerInvoiceService],
    }).compile();

    controller = module.get<ManualCustomerInvoiceController>(ManualCustomerInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
