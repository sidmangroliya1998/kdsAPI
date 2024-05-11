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
import { GlVendorCodeService } from './gl-vendor-code.service';
import { CreateGlVendorCodeDto } from './dto/create-gl-vendor-code.dto';
import { UpdateGlVendorCodeDto } from './dto/update-gl-vendor-code.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';

import { GlVendorCodeDocument } from './schemas/gl-vendor-code.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('gl-vendor-code')
@ApiTags('Gl Vendor Code')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlVendorCodeController {
  constructor(private readonly glVendorCodeService: GlVendorCodeService) {}

  @Post()
  @PermissionGuard(PermissionSubject.GlVendorCode, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlVendorCodeDto) {
    return await this.glVendorCodeService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlVendorCode, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlVendorCodeDocument>> {
    return await this.glVendorCodeService.findAll(req, paginateOptions);
  }

  @Get(':glVendorCodeId')
  @PermissionGuard(PermissionSubject.GlVendorCode, Permission.Common.FETCH)
  async findOne(@Param('glVendorCodeId') glVendorCodeId: string) {
    return await this.glVendorCodeService.findOne(glVendorCodeId);
  }

  @Patch(':glVendorCodeId')
  @PermissionGuard(PermissionSubject.GlVendorCode, Permission.Common.UPDATE)
  async update(
    @Param('glVendorCodeId') glVendorCodeId: string,
    @Body() dto: UpdateGlVendorCodeDto,
  ) {
    return await this.glVendorCodeService.update(glVendorCodeId, dto);
  }

  @Delete(':glVendorCodeId')
  @PermissionGuard(PermissionSubject.GlVendorCode, Permission.Common.DELETE)
  async remove(@Param('glVendorCodeId') glVendorCodeId: string) {
    return await this.glVendorCodeService.remove(glVendorCodeId);
  }
}
