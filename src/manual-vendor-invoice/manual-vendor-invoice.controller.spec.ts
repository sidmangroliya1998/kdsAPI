import { Test, TestingModule } from '@nestjs/testing';
import { ManualVendorInvoiceController } from './manual-vendor-invoice.controller';
import { ManualVendorInvoiceService } from './manual-vendor-invoice.service';

describe('ManualVendorInvoiceController', () => {
  let controller: ManualVendorInvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualVendorInvoiceController],
      providers: [ManualVendorInvoiceService],
    }).compile();

    controller = module.get<ManualVendorInvoiceController>(ManualVendorInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
