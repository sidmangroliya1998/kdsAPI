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
} from '@nestjs/common';
import { GlMaterialCodeService } from './gl-material-code.service';
import { CreateGlMaterialCodeDto } from './dto/create-gl-material-code.dto';
import { UpdateGlMaterialCodeDto } from './dto/update-gl-material-code.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';

import { GlMaterialCodeDocument } from './schemas/gl-material-code.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('gl-material-code')
@ApiTags('Gl Material Code')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlMaterialCodeController {
  constructor(private readonly glMaterialCodeService: GlMaterialCodeService) {}

  @Post()
  @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlMaterialCodeDto) {
    return await this.glMaterialCodeService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlMaterialCodeDocument>> {
    return await this.glMaterialCodeService.findAll(req, paginateOptions);
  }

  @Get(':glMaterialCodeId')
  @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
  async findOne(@Param('glMaterialCodeId') glMaterialCodeId: string) {
    return await this.glMaterialCodeService.findOne(glMaterialCodeId);
  }

  @Patch(':glMaterialCodeId')
  @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
  async update(
    @Param('glMaterialCodeId') glMaterialCodeId: string,
    @Body() dto: UpdateGlMaterialCodeDto,
  ) {
    return await this.glMaterialCodeService.update(glMaterialCodeId, dto);
  }

  @Delete(':glMaterialCodeId')
  @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
  async remove(@Param('glMaterialCodeId') glMaterialCodeId: string) {
    return await this.glMaterialCodeService.remove(glMaterialCodeId);
  }
}
