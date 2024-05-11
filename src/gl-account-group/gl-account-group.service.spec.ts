import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountGroupService } from './gl-account-group.service';

describe('GlAccountGroupService', () => {
  let service: GlAccountGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlAccountGroupService],
    }).compile();

    service = module.get<GlAccountGroupService>(GlAccountGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
