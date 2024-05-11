import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountGroupController } from './gl-account-group.controller';
import { GlAccountGroupService } from './gl-account-group.service';

describe('GlAccountGroupController', () => {
  let controller: GlAccountGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlAccountGroupController],
      providers: [GlAccountGroupService],
    }).compile();

    controller = module.get<GlAccountGroupController>(GlAccountGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
