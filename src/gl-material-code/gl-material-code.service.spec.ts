import { Test, TestingModule } from '@nestjs/testing';
import { GlMaterialCodeService } from './gl-material-code.service';

describe('GlMaterialCodeService', () => {
  let service: GlMaterialCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlMaterialCodeService],
    }).compile();

    service = module.get<GlMaterialCodeService>(GlMaterialCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
