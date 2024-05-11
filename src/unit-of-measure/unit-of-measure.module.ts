import { Module } from '@nestjs/common';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { UnitOfMeasureController } from './unit-of-measure.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UnitOfMeasure,
  UnitOfMeasureSchema,
} from './schemas/unit-of-measure.schema';
import { UnitOfMeasureHelperService } from './unit-of-measure-helper.service';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UnitOfMeasureController],
  providers: [UnitOfMeasureService, UnitOfMeasureHelperService],
  exports: [UnitOfMeasureService, UnitOfMeasureHelperService],
})
export class UnitOfMeasureModule {}
