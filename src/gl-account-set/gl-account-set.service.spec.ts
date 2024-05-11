import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountSetService } from './gl-account-set.service';

describe('GlAccountSetService', () => {
  let service: GlAccountSetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlAccountSetService],
    }).compile();

    service = module.get<GlAccountSetService>(GlAccountSetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
