import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Req,
  UploadedFiles,
  Header,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';

import { FileUploaderService } from './file-uploader.service';

import { FilesFastifyInterceptor, diskStorage } from 'fastify-file-interceptor';
import { MultipleFileDto } from './files.dto';
import {
  editFileName,
  idFileFilter,
  imageFileFilter,
  videoFileFilter,
  zipFilter,
} from 'src/core/Helpers/file-upload-utils';
import { SkipInterceptor } from 'src/core/decorators/skip-interceptor.decorator';

@ApiTags('Common')
@Controller('file-uploader')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class FileUploaderController {
  constructor(private readonly fileUploaderService: FileUploaderService) {}

  @ApiConsumes('multipart/form-data')
  @Post('images')
  @UseInterceptors(
    FilesFastifyInterceptor('files', 10, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async images(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: MultipleFileDto,
  ) {
    const fileRequest = { ...body, type: 'files' };
    const fileUrls = await this.fileUploaderService.upload(
      req,
      fileRequest,
      files,
    );

    return fileUrls;
  }

  @ApiConsumes('multipart/form-data')
  @Post('images/bulk')
  @UseInterceptors(
    FilesFastifyInterceptor('files', 1, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: zipFilter,
    }),
  )
  @Header('Content-Type', 'application/xlsx')
  @Header('Content-Disposition', 'attachment; filename="images.xlsx"')
  @SkipInterceptor()
  async bulkUpload(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File,
    @Body() body: MultipleFileDto,
  ) {
    const fileRequest = { ...body, type: 'images' };
    const fileStream = await this.fileUploaderService.handleZip(
      req,
      fileRequest,
      files,
    );

    return new StreamableFile(fileStream);
  }

  @ApiConsumes('multipart/form-data')
  @Post('videos')
  @UseInterceptors(
    FilesFastifyInterceptor('files', 10, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: videoFileFilter,
    }),
  )
  async videos(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: MultipleFileDto,
  ) {
    const fileRequest = { ...body, type: 'videos' };
    const fileUrls = await this.fileUploaderService.upload(
      req,
      fileRequest,
      files,
    );

    return fileUrls;
  }

  // @ApiConsumes('multipart/form-data')
  // @Post('ids')
  // @UseInterceptors(
  //   FilesFastifyInterceptor('files', 10, {
  //     storage: diskStorage({
  //       destination: './upload/',
  //       filename: editFileName,
  //     }),
  //     fileFilter: idFileFilter,
  //   }),
  // )
  async ids(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: MultipleFileDto,
  ) {
    const fileRequest = { ...body, type: 'ids' };
    const fileUrls = await this.fileUploaderService.upload(
      req,
      fileRequest,
      files,
    );

    return fileUrls;
  }

  @ApiConsumes('multipart/form-data')
  @Post('images-png')
  @UseInterceptors(
    FilesFastifyInterceptor('files', 10, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async imagesPng(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: MultipleFileDto,
  ) {
    const fileRequest = { ...body, type: 'files' };
    const fileUrlsPng = await this.fileUploaderService.uploadPNG(
      req,
      fileRequest,
      files,
    );
   
    return fileUrlsPng;
  }
}
