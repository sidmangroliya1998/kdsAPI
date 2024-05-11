import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountService } from './gl-account.service';

describe('GlAccountService', () => {
  let service: GlAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlAccountService],
    }).compile();

    service = module.get<GlAccountService>(GlAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
