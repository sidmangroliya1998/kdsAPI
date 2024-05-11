import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { FeedUsService } from './feed-us.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Supplier,
  SupplierSchema,
} from 'src/supplier/schemas/suppliers.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
    ]),
  ],
  controllers: [],
  providers: [WhatsappService, FeedUsService],
  exports: [WhatsappService, FeedUsService],
})
export class HttpCallerModule {}
