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
import { BundleService } from './bundle.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { BundleDocument } from './schemas/bundle.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('bundle')
@ApiTags('Bundles')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  @Post()
  @PermissionGuard(PermissionSubject.Bundle, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateBundleDto) {
    return await this.bundleService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Bundle, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<BundleDocument>> {
    return await this.bundleService.findAll(req, paginateOptions);
  }

  @Get(':bundleId')
  @PermissionGuard(PermissionSubject.Bundle, Permission.Common.FETCH)
  async findOne(@Param('bundleId') bundleId: string) {
    return await this.bundleService.findOne(bundleId);
  }

  @Patch(':bundleId')
  @PermissionGuard(PermissionSubject.Bundle, Permission.Common.UPDATE)
  async update(
    @Req() req,
    @Param('bundleId') bundleId: string,
    @Body() dto: UpdateBundleDto,
  ) {
    return await this.bundleService.update(req, bundleId, dto);
  }

  @Delete(':bundleId')
  @PermissionGuard(PermissionSubject.Bundle, Permission.Common.DELETE)
  async remove(@Param('bundleId') bundleId: string) {
    return await this.bundleService.remove(bundleId);
  }
}
