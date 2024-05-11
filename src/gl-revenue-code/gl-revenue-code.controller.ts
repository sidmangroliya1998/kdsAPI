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
import { UpdateGlRevenueCodeDto } from './dto/update-gl-revenue-code.dto';
import { GlRevenueCodeDocument } from './schemas/gl-revenue-code.schema';
import { CreateGlRevenueCodeDto } from './dto/create-gl-revenue-code.dto';
import { GlRevenueCodeService } from './gl-revenue-code.service';

@Controller('gl-revenue-code')
@ApiTags('Gl Revenue Code')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlRevenueCodeController {
    constructor(private readonly glRevenueCodeService: GlRevenueCodeService) { }

    @Post()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateGlRevenueCodeDto) {
        return await this.glRevenueCodeService.create(req, dto);
    }

    @Get()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlRevenueCodeDocument>> {
        return await this.glRevenueCodeService.findAll(req, paginateOptions);
    }

    @Get(':glRevenueCodeId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOne(@Param('glRevenueCodeId') glRevenueCodeId: string) {
        return await this.glRevenueCodeService.findOne(glRevenueCodeId);
    }

    @Patch(':glRevenueCodeId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async update(
        @Param('glRevenueCodeId') glRevenueCodeId: string,
        @Body() dto: UpdateGlRevenueCodeDto,
    ) {
        return await this.glRevenueCodeService.update(glRevenueCodeId, dto);
    }

    @Delete(':glRevenueCodeId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async remove(@Param('glRevenueCodeId') glRevenueCodeId: string) {
        return await this.glRevenueCodeService.remove(glRevenueCodeId);
    }
}
