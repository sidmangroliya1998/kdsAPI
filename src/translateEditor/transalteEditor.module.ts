import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {  TranslateEditorController } from './translateEditor.controller';
import {  TranslateEditorService } from './translateEditor.service';
import { TranslateEditor, TranslateEditorSchema } from './schemas/TranslateEditor.schema';
import { S3Service } from 'src/core/Providers/Storage/S3.service';



@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TranslateEditor.name, schema: TranslateEditorSchema },     
    ]),
  ],
  controllers: [TranslateEditorController],
  providers: [TranslateEditorService ,S3Service],
  exports: [TranslateEditorService],
})
export class TranslateEditorModule {}
