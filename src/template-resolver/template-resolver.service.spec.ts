import { Test, TestingModule } from '@nestjs/testing';
import { TemplateResolverService } from './template-resolver.service';

describe('TemplateResolverService', () => {
  let service: TemplateResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateResolverService],
    }).compile();

    service = module.get<TemplateResolverService>(TemplateResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
