import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseCategoryService } from './purchase-category.service';

describe('PurchaseCategoryService', () => {
  let service: PurchaseCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseCategoryService],
    }).compile();

    service = module.get<PurchaseCategoryService>(PurchaseCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
