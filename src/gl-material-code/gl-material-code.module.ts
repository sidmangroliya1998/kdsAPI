import { Module } from '@nestjs/common';
import { GlMaterialCodeService } from './gl-material-code.service';
import { GlMaterialCodeController } from './gl-material-code.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlMaterialCode,
  GlMaterialCodeSchema,
} from './schemas/gl-material-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlMaterialCode.name, schema: GlMaterialCodeSchema },
    ]),
  ],
  controllers: [GlMaterialCodeController],
  providers: [GlMaterialCodeService],
  exports:[GlMaterialCodeService]
})
export class GlMaterialCodeModule {}
