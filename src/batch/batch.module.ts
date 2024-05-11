import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Batch, BatchSchema } from './schemas/batch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
  ],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
