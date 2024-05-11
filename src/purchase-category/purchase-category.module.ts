import { Module } from '@nestjs/common';
import { PurchaseCategoryService } from './purchase-category.service';
import { PurchaseCategoryController } from './purchase-category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseCategory,
  PurchaseCategorySchema,
} from './schemas/purchase-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseCategory.name, schema: PurchaseCategorySchema },
    ]),
  ],
  controllers: [PurchaseCategoryController],
  providers: [PurchaseCategoryService],
  exports: [PurchaseCategoryService],
  
})
export class PurchaseCategoryModule {}
