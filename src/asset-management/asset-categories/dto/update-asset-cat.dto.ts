import { PartialType } from '@nestjs/swagger';
import { CreateAssetCategoryDto } from './create-asset-cat.dto';

export class UpdateAssetCategoryDto extends PartialType(CreateAssetCategoryDto) { }
