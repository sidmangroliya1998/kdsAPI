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
import { GlAccountGroupService } from './gl-account-group.service';
import { CreateGlAccountGroupDto } from './dto/create-gl-account-group.dto';
import { UpdateGlAccountGroupDto } from './dto/update-gl-account-group.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';

import { GlAccountGroupDocument } from './schemas/gl-account-group.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('gl-account-group')
@ApiTags('Gl Account Group')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlAccountGroupController {
  constructor(private readonly glAccountGroupService: GlAccountGroupService) {}

  @Post()
  @PermissionGuard(PermissionSubject.GlAccountGroup, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlAccountGroupDto) {
    return await this.glAccountGroupService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlAccountGroup, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountGroupDocument>> {
    return await this.glAccountGroupService.findAll(req, paginateOptions);
  }

  @Get(':glAccountGroupId')
  @PermissionGuard(PermissionSubject.GlAccountGroup, Permission.Common.FETCH)
  async findOne(@Param('glAccountGroupId') glAccountGroupId: string) {
    return await this.glAccountGroupService.findOne(glAccountGroupId);
  }

  @Patch(':glAccountGroupId')
  @PermissionGuard(PermissionSubject.GlAccountGroup, Permission.Common.UPDATE)
  async update(
    @Param('glAccountGroupId') glAccountGroupId: string,
    @Body() dto: UpdateGlAccountGroupDto,
  ) {
    return await this.glAccountGroupService.update(glAccountGroupId, dto);
  }

  @Delete(':glAccountGroupId')
  @PermissionGuard(PermissionSubject.GlAccountGroup, Permission.Common.DELETE)
  async remove(@Param('glAccountGroupId') glAccountGroupId: string) {
    return await this.glAccountGroupService.remove(glAccountGroupId);
  }
}
