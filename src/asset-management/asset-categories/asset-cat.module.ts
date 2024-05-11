import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { AssetCategory, AssetCategorySchema } from './schemas/asset-cat.schema';
import { AssetCategoryController } from './asset-cat.controller';
import { AssetCategoryService } from './asset-cat.service';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AssetCategory.name, schema: AssetCategorySchema },
        ]),
    ],
    controllers: [AssetCategoryController],
    providers: [AssetCategoryService],
    exports: [AssetCategoryService]
})
export class AssetCategoryModule { }
