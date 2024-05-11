import { Test, TestingModule } from '@nestjs/testing';
import { GlVendorCodeController } from './gl-account-group.controller';
import { GlVendorCodeService } from './gl-account-group.service';

describe('GlVendorCodeController', () => {
  let controller: GlVendorCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlVendorCodeController],
      providers: [GlVendorCodeService],
    }).compile();

    controller = module.get<GlVendorCodeController>(GlVendorCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
