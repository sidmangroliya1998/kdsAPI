import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseCategoryDto } from './create-purchase-category.dto';

export class UpdatePurchaseCategoryDto extends PartialType(CreatePurchaseCategoryDto) {}
