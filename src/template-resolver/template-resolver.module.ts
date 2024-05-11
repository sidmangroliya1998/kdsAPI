import { Module } from '@nestjs/common';
import { TemplateResolverService } from './template-resolver.service';
import { TemplateResolverController } from './template-resolver.controller';
import { StorageModule } from 'src/core/Providers/Storage/storage.module';
import { FileUploaderModule } from 'src/file-uploader/file-uploader.module';

@Module({
  imports: [StorageModule, FileUploaderModule],
  controllers: [TemplateResolverController],
  providers: [TemplateResolverService],
  exports: [TemplateResolverService],
})
export class TemplateResolverModule {}
