import { Test, TestingModule } from '@nestjs/testing';
import { GlVendorCodeService } from './gl-vendor-code.service';

describe('GlVendorCodeService', () => {
  let service: GlVendorCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlVendorCodeService],
    }).compile();

    service = module.get<GlVendorCodeService>(GlVendorCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
