import { Module } from '@nestjs/common';
import { GlAccountGroupService } from './gl-account-group.service';
import { GlAccountGroupController } from './gl-account-group.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlAccountGroup,
  GlAccountGroupSchema,
} from './schemas/gl-account-group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlAccountGroup.name, schema: GlAccountGroupSchema },
    ]),
  ],
  controllers: [GlAccountGroupController],
  providers: [GlAccountGroupService],
  exports:[GlAccountGroupService]
})
export class GlAccountGroupModule {}
