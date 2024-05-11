import { Module } from '@nestjs/common';
import { GlVendorCodeService } from './gl-vendor-code.service';
import { GlVendorCodeController } from './gl-vendor-code.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlVendorCode,
  GlVendorCodeSchema,
} from './schemas/gl-vendor-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlVendorCode.name, schema: GlVendorCodeSchema },
    ]),
  ],
  controllers: [GlVendorCodeController],
  providers: [GlVendorCodeService],
  exports:[GlVendorCodeService]
})
export class GlVendorCodeModule {}
