import { Test, TestingModule } from '@nestjs/testing';
import { GlAccountController } from './gl-account.controller';
import { GlAccountService } from './gl-account.service';

describe('GlAccountController', () => {
  let controller: GlAccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlAccountController],
      providers: [GlAccountService],
    }).compile();

    controller = module.get<GlAccountController>(GlAccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
