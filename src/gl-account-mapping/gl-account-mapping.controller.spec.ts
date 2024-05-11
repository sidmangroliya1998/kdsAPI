import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountMappingController } from './gl-account-mapping.controller';
import { GlAccountMappingService } from './gl-account-mapping.service';

describe('GlAccountMappingController', () => {
  let controller: GlAccountMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlAccountMappingController],
      providers: [GlAccountMappingService],
    }).compile();

    controller = module.get<GlAccountMappingController>(GlAccountMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
