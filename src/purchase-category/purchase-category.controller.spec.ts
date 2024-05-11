import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseCategoryController } from './purchase-category.controller';
import { PurchaseCategoryService } from './purchase-category.service';

describe('PurchaseCategoryController', () => {
  let controller: PurchaseCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseCategoryController],
      providers: [PurchaseCategoryService],
    }).compile();

    controller = module.get<PurchaseCategoryController>(PurchaseCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
