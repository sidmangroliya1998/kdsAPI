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
import { GlAccountMappingService } from './gl-account-mapping.service';
import { CreateGlAccountMappingDto } from './dto/create-gl-account-mapping.dto';
import { UpdateGlAccountMappingDto } from './dto/update-gl-account-mapping.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { GlAccountMappingDocument } from './schemas/gl-account-mapping.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('gl-account-mapping')
@ApiTags('GL Account Mapping')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlAccountMappingController {
  constructor(
    private readonly glAccountMappingService: GlAccountMappingService,
  ) {}

  @Post()
  @PermissionGuard(PermissionSubject.GlAccountMapping, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlAccountMappingDto) {
    return await this.glAccountMappingService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlAccountMapping, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountMappingDocument>> {
    return await this.glAccountMappingService.findAll(req, paginateOptions);
  }

  @Get(':glAccountMappingId')
  @PermissionGuard(PermissionSubject.GlAccountMapping, Permission.Common.FETCH)
  async findOne(@Param('glAccountMappingId') glAccountMappingId: string) {
    return await this.glAccountMappingService.findOne(glAccountMappingId);
  }

  @Patch(':glAccountMappingId')
  @PermissionGuard(PermissionSubject.GlAccountMapping, Permission.Common.UPDATE)
  async update(
    @Param('glAccountMappingId') glAccountMappingId: string,
    @Body() dto: UpdateGlAccountMappingDto,
  ) {
    return await this.glAccountMappingService.update(glAccountMappingId, dto);
  }

  @Delete(':glAccountMappingId')
  @PermissionGuard(PermissionSubject.GlAccountMapping, Permission.Common.DELETE)
  async remove(@Param('glAccountMappingId') glAccountMappingId: string) {
    return await this.glAccountMappingService.remove(glAccountMappingId);
  }
}
