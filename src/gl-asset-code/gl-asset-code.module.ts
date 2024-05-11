import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { GlAssetCodeService } from './gl-asset-code.service';
import { GlAssetCodeController } from './gl-asset-code.controller';
import { GlAssetCode, GlAssetCodeSchema } from './schemas/create-gl-asset.schema';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GlAssetCode.name, schema: GlAssetCodeSchema },
        ]),
    ],
    controllers: [GlAssetCodeController],
    providers: [GlAssetCodeService],
    exports: [GlAssetCodeService]
})
export class GlAssetCodeModule { }
