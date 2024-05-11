import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  Query,
  Patch,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags ,ApiConsumes } from '@nestjs/swagger';


import { PaginateResult } from 'mongoose';

import { PaginationDto } from 'src/core/Constants/pagination';

import { CreateTranslateEditorDto } from './dto/create-translateEditor.dto';
import { TranslateEditorService } from './translateEditor.service';
import { TranslateEditorDocument } from './schemas/TranslateEditor.schema';
import { UpdateTranslateEditorDto, UpdateTranslateEditorDtoTwo } from './dto/update-translateEditor.dto';
import { FileFieldsFastifyInterceptor, diskStorage } from 'fastify-file-interceptor';
import { editFileName, imageFileFilter, jsonFileFilter } from 'src/core/Helpers/file-upload-utils';

@ApiTags('TranslateEditor')
@Controller('translateEditor')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class TranslateEditorController {
  constructor(private readonly TranslateEditorService: TranslateEditorService) {}

  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(
    FileFieldsFastifyInterceptor([
      {
        name: "arFile",
        maxCount: 1,
      },
      {
        name: "enFile",
        maxCount: 1,
      },
    ], {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: jsonFileFilter,
    }),
  )
  // @PermissionGuard(PermissionSubject.Supplier, Permission.Common.CREATE)
  add(
    @Req() req,
    @UploadedFiles() {arFile , enFile} ,
    @Body() dto: CreateTranslateEditorDto,
  ): Promise<TranslateEditorDocument> {
    return this.TranslateEditorService.create(dto , arFile ,enFile );
  }

  @Get(':module')
  // @PermissionGuard(PermissionSubject.Supplier, Permission.Common.LIST)
  getByModuleName(
    @Param('module') module: string,
  ) {
    return this.TranslateEditorService.get(module);
  }


  @Patch(':module')
  // @PermissionGuard(PermissionSubject.Driver, Permission.Common.UPDATE)
  async update(
    @Param('module') module: string,
    @Body() dto: UpdateTranslateEditorDto,
  ) {
    return await this.TranslateEditorService.update(module, dto);
  }

  @ApiConsumes('multipart/form-data')
  @Patch('/v2/module2')
  @UseInterceptors(
    FileFieldsFastifyInterceptor([
      {
        name: "arFile",
        maxCount: 1,
      },
      {
        name: "enFile",
        maxCount: 1,
      },
    ], {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: jsonFileFilter,
    }),
  )
  async file(
    @Req() req: any,
    @UploadedFiles() {arFile , enFile} ,
    @Body() dto: UpdateTranslateEditorDtoTwo,
  ) {
    return await this.TranslateEditorService.updateTwo(dto, arFile , enFile);
  }


}
