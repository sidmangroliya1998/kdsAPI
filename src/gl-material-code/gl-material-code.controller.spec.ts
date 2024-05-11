import { Test, TestingModule } from '@nestjs/testing';
import { GlMaterialCodeController } from './gl-account-group.controller';
import { GlMaterialCodeService } from './gl-account-group.service';

describe('GlMaterialCodeController', () => {
  let controller: GlMaterialCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlMaterialCodeController],
      providers: [GlMaterialCodeService],
    }).compile();

    controller = module.get<GlMaterialCodeController>(GlMaterialCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
