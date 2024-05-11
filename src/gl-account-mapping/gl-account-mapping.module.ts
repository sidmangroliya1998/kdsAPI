import { Module } from '@nestjs/common';
import { GlAccountMappingService } from './gl-account-mapping.service';
import { GlAccountMappingController } from './gl-account-mapping.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlAccountMapping,
  GlAccountMappingSchema,
} from './schemas/gl-account-mapping.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlAccountMapping.name, schema: GlAccountMappingSchema },
    ]),
  ],
  controllers: [GlAccountMappingController],
  providers: [GlAccountMappingService],
  exports:[GlAccountMappingService]
})
export class GlAccountMappingModule {}
