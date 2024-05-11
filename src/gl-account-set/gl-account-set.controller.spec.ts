import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountSetController } from './gl-account-set.controller';
import { GlAccountSetService } from './gl-account-set.service';

describe('GlAccountSetController', () => {
  let controller: GlAccountSetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlAccountSetController],
      providers: [GlAccountSetService],
    }).compile();

    controller = module.get<GlAccountSetController>(GlAccountSetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
