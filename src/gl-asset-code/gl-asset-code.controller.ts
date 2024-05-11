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

import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';

import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { GlAssetCodeService } from './gl-asset-code.service';
import { CreateGlAssetCodeDto } from './dto/create-gl-asset-code.dto';
import { UpdateGlAssetCodeDto } from './dto/update-gl-asset-code.dto';
import { GlAssetCodeDocument } from './schemas/create-gl-asset.schema';

@Controller('gl-asset-code')
@ApiTags('Gl Asset Code')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlAssetCodeController {
    constructor(private readonly glAssetCodeService: GlAssetCodeService) { }

    @Post()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateGlAssetCodeDto) {
        return await this.glAssetCodeService.create(req, dto);
    }

    @Get()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlAssetCodeDocument>> {
        return await this.glAssetCodeService.findAll(req, paginateOptions);
    }

    @Get(':glAssetCodeId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOne(@Param('glAssetCodeId') glAssetCodeId: string) {
        return await this.glAssetCodeService.findOne(glAssetCodeId);
    }

    @Patch(':glAssetCodeId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async update(
        @Param('glAssetCodeId') glAssetCodeId: string,
        @Body() dto: UpdateGlAssetCodeDto,
    ) {
        return await this.glAssetCodeService.update(glAssetCodeId, dto);
    }

    @Delete(':glAssetCodeId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async remove(@Param('glAssetCodeId') glAssetCodeId: string) {
        return await this.glAssetCodeService.remove(glAssetCodeId);
    }
}
