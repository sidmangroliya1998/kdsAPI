import { Module } from '@nestjs/common';
import { BundleService } from './bundle.service';
import { BundleController } from './bundle.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bundle, BundleSchema } from './schemas/bundle.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bundle.name, schema: BundleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BundleController],
  providers: [BundleService],
})
export class BundleModule {}
