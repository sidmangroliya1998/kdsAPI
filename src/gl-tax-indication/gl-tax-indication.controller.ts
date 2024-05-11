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
import { GlTaxIndicationService } from './gl-tax-indication.service';
import { GlTaxIndicationDocument } from './schemas/gl-tax-indication.schema';
import { CreateGlTaxIndicationDto } from './dto/create-gl-tax-indication.dto';
import { UpdateGlTaxIndicationDto } from './dto/update-gl-tax-indication.dto';

@Controller('gl-tax-indication')
@ApiTags('Gl Tax Indication')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlTaxIndicationController {
    constructor(private readonly glTaxIndicationService: GlTaxIndicationService) { }

    @Post()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateGlTaxIndicationDto) {
        return await this.glTaxIndicationService.create(req, dto);
    }

    @Get()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlTaxIndicationDocument>> {
        return await this.glTaxIndicationService.findAll(req, paginateOptions);
    }

    @Get(':glTaxIndicationId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOne(@Param('glTaxIndicationId') glTaxIndicationId: string) {
        return await this.glTaxIndicationService.findOne(glTaxIndicationId);
    }

    @Patch(':glTaxIndicationId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async update(
        @Param('glTaxIndicationId') glTaxIndicationId: string,
        @Body() dto: UpdateGlTaxIndicationDto,
    ) {
        return await this.glTaxIndicationService.update(glTaxIndicationId, dto);
    }

    @Delete(':glTaxIndicationId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async remove(@Param('glTaxIndicationId') glTaxIndicationId: string) {
        return await this.glTaxIndicationService.remove(glTaxIndicationId);
    }
}
