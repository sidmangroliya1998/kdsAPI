import { Test, TestingModule } from '@nestjs/testing';
import { TemplateResolverController } from './template-resolver.controller';
import { TemplateResolverService } from './template-resolver.service';

describe('TemplateResolverController', () => {
  let controller: TemplateResolverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateResolverController],
      providers: [TemplateResolverService],
    }).compile();

    controller = module.get<TemplateResolverController>(TemplateResolverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
