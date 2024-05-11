import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountMappingService } from './gl-account-mapping.service';

describe('GlAccountMappingService', () => {
  let service: GlAccountMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlAccountMappingService],
    }).compile();

    service = module.get<GlAccountMappingService>(GlAccountMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
