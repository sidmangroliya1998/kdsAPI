import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  Req, UploadedFiles,
  UseInterceptors, Header
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { MenuAdditionService } from '../service/menu-addition.service';
import {
  CreateMenuAdditionDTO,
  UpdateMenuAdditionDTO,
} from '../dto/menu-addition.dto';
import { MenuAdditionDocument } from '../schemas/menu-addition.schema';
import { ApiBearerAuth, ApiHeader, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FilesFastifyInterceptor, diskStorage } from 'fastify-file-interceptor';
import { editFileName, importFilter } from 'src/core/Helpers/file-upload-utils';
import { FileImportProcessDto } from '../dto/file-import.dto';

@Controller('menu-addition')
@ApiTags('Menu Additions')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class MenuAdditionController {
  constructor(private readonly menuAdditionService: MenuAdditionService) { }

  @Post()
  @PermissionGuard(PermissionSubject.MenuAddition, Permission.Common.CREATE)
  async create(
    @Req() req,
    @Body() createMenuAdditionDTO: CreateMenuAdditionDTO,
  ) {
    return await this.menuAdditionService.create(req, createMenuAdditionDTO);
  }

  @Get()
  @PermissionGuard(PermissionSubject.MenuAddition, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<MenuAdditionDocument>> {
    return await this.menuAdditionService.findAll(req, paginateOptions);
  }

  @Get(':menuAdditionId')
  @PermissionGuard(PermissionSubject.MenuAddition, Permission.Common.FETCH)
  async findOne(@Param('menuAdditionId') menuAdditionId: string) {
    return await this.menuAdditionService.findOne(menuAdditionId);
  }

  @Patch(':menuAdditionId')
  @PermissionGuard(PermissionSubject.MenuAddition, Permission.Common.UPDATE)
  async update(
    @Param('menuAdditionId') menuAdditionId: string,
    @Body() updateMenuAdditionDTO: UpdateMenuAdditionDTO,
    @Req() req,
  ) {
    return await this.menuAdditionService.update(
      menuAdditionId,
      updateMenuAdditionDTO,
      req
    );
  }

  @Delete(':menuAdditionId')
  @PermissionGuard(PermissionSubject.MenuAddition, Permission.Common.DELETE)
  async remove(@Param('menuAdditionId') menuAdditionId: string) {
    return await this.menuAdditionService.remove(menuAdditionId);
  }

  @ApiConsumes('multipart/form-data')
  @Post('import-data')
  @UseInterceptors(
    FilesFastifyInterceptor('file', 1, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: importFilter,
    }),
  )
  @PermissionGuard(PermissionSubject.MenuAddition, Permission.Common.CREATE)
  async file(
    @Req() req: any,
    @UploadedFiles() file: Express.Multer.File,
    @Body() dto: FileImportProcessDto,
  ) {
    return await this.menuAdditionService.menuAdditionFileUploadProcess(req, file);
  }

}
