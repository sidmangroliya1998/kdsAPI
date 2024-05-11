import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { QueryMaterialDto } from './dto/query-material.dto';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { MaterialDocument } from './schemas/material.schema';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiBearerAuth, ApiHeader, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { RestaurantMaterialDto } from './dto/restaurant-material.dto';
import { RestaurantMaterialDocument } from './schemas/restaurant-material.schema';
import { FilesFastifyInterceptor, diskStorage } from 'fastify-file-interceptor';
import { editFileName, importFilter } from 'src/core/Helpers/file-upload-utils';
import { ImportMatDto } from './dto/mat-uom.dto';

@Controller('material')
@ApiTags('Materials')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class MaterialController {
  constructor(private readonly materialService: MaterialService) { }

  @Post()
  @PermissionGuard(PermissionSubject.Material, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateMaterialDto) {
    return await this.materialService.create(req, dto);
  }

  @Post('addition-details')
  @PermissionGuard(PermissionSubject.Material, Permission.Common.CREATE)
  async additionalDetails(@Req() req, @Body() dto: RestaurantMaterialDto) {
    return await this.materialService.additionalMaterialDetails(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Material, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryMaterialDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<MaterialDocument>> {
    return await this.materialService.findAll(req, query, paginateOptions);
  }

  @Get('additional-details')
  @PermissionGuard(PermissionSubject.Material, Permission.Common.LIST)
  async findRestaurantMaterials(
    @Req() req,
    @Query() query: QueryMaterialDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<RestaurantMaterialDocument>> {
    return await this.materialService.findRestaurantMaterials(
      req,
      query,
      paginateOptions,
    );
  }

  @Get(':materialId')
  @PermissionGuard(PermissionSubject.Material, Permission.Common.FETCH)
  async findOne(
    @Param('materialId') materialId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.materialService.findOne(materialId, i18n);
  }

  @Patch(':materialId')
  @PermissionGuard(PermissionSubject.Material, Permission.Common.UPDATE)
  async update(
    @Req() req,
    @Param('materialId') materialId: string,
    @Body() dto: UpdateMaterialDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.materialService.update(req, materialId, dto, i18n);
  }

  @Delete(':materialId')
  @PermissionGuard(PermissionSubject.Material, Permission.Common.DELETE)
  async remove(
    @Req() req,
    @Param('materialId') materialId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.materialService.remove(req, materialId, i18n);
  }

  @ApiConsumes('multipart/form-data')
  @Post('material-uom-update')
  @UseInterceptors(
    FilesFastifyInterceptor('file', 1, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: importFilter,
    }),
  )

  async file(
    @Req() req: any,
    @Body() dto: ImportMatDto,
    @UploadedFiles() file: Express.Multer.File
  ) {
    return await this.materialService.excelProcessing(req, file);
  }

  @Patch('setup-override/:materialId')
  @PermissionGuard(PermissionSubject.Material, Permission.Common.UPDATE)
  async updateOverRidePricing(
    @Req() req,
    @Param('materialId') materialId: string
  ) {
    return await this.materialService.addRestaurantMaterialOverride(req, materialId);
  }
}
