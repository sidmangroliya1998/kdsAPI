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
import { GlAccountSetService } from './gl-account-set.service';
import { CreateGlAccountSetDto } from './dto/create-gl-account-set.dto';
import { UpdateGlAccountSetDto } from './dto/update-gl-account-set.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { GlAccountSetDocument } from './schemas/gl-account-set.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('gl-account-set')
@ApiTags('Gl Account Set')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlAccountSetController {
  constructor(private readonly glAccountSetService: GlAccountSetService) { }

  @Post()
  @PermissionGuard(PermissionSubject.GlAccountSet, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlAccountSetDto) {
    return await this.glAccountSetService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlAccountSet, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountSetDocument>> {
    return await this.glAccountSetService.findAll(req, paginateOptions);
  }

  @Get(':glAccountSetId')
  @PermissionGuard(PermissionSubject.GlAccountSet, Permission.Common.FETCH)
  async findOne(@Param('glAccountSetId') glAccountSetId: string) {
    return await this.glAccountSetService.findOne(glAccountSetId);
  }

  @Patch(':glAccountSetId')
  @PermissionGuard(PermissionSubject.GlAccountSet, Permission.Common.UPDATE)
  async update(
    @Param('glAccountSetId') glAccountSetId: string,
    @Body() dto: UpdateGlAccountSetDto,
  ) {
    return await this.glAccountSetService.update(glAccountSetId, dto);
  }

  @Delete(':glAccountSetId')
  @PermissionGuard(PermissionSubject.GlAccountSet, Permission.Common.DELETE)
  async remove(@Param('glAccountSetId') glAccountSetId: string) {
    return await this.glAccountSetService.remove(glAccountSetId);
  }

  @Patch('gl-acc-update/all')
  @PermissionGuard(PermissionSubject.GlAccountSet, Permission.Common.DELETE)
  async updateManyGLAccount(@Req() req,  @Body() glAccountIds: string[]) {
    return await this.glAccountSetService.updateManyGLAcc(req, glAccountIds);
  }
}
