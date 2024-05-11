import { Module } from '@nestjs/common';
import { GlAccountSetService } from './gl-account-set.service';
import { GlAccountSetController } from './gl-account-set.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlAccountSet,
  GlAccountSetSchema,
} from './schemas/gl-account-set.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlAccountSet.name, schema: GlAccountSetSchema },
    ]),
  ],
  controllers: [GlAccountSetController],
  providers: [GlAccountSetService],
  exports:[GlAccountSetService]
})
export class GlAccountSetModule {}
