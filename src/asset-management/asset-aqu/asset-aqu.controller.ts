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
import { AssetAquService } from './asset-aqu.service';
import { CreateAssetAquDto } from './dto/create-asset-aqu.dto';
import { AssetAquDocument } from './schemas/asset-aqu.schema';
import { UpdateAssetAquDto } from './dto/update-asset-aqu.dto';
import { CreateAssetAquTransactionDto } from './dto/create-asset-aqu-transaction.dto';
import { CreateAssetAquDepDto } from './dto/create-asset-dep.dto';
import { AssetAquTransDocument } from './schemas/asset-aqu-transaction.schema';
import { CreateAssetRetirementDto } from './dto/create-asset-retirement.dto';
import { AssetRetirementDocument } from './schemas/asset-retirement.schema';
import { AssetAquDepDocument } from './schemas/asset-aqu-dep.schema';

@Controller('asset-aqu')
@ApiTags('Asset Aquisition')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class AssetAquController {
    constructor(private readonly assetAqService: AssetAquService) { }

    @Post()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateAssetAquDto) {
        return await this.assetAqService.create(req, dto);
    }

    @Get()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<any> {
        return await this.assetAqService.findAll(req, paginateOptions);
    }

    @Get(':assetAquId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOne(@Param('assetAquId') assetAquId: string) {
        return await this.assetAqService.findOne(assetAquId);
    }

    @Patch(':assetAquId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async update(
        @Param('assetAquId') assetAquId: string,
        @Body() dto: UpdateAssetAquDto,
    ) {
        return await this.assetAqService.update(assetAquId, dto);
    }

    @Delete(':assetAquId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async remove(@Param('assetAquId') assetAquId: string) {
        return await this.assetAqService.remove(assetAquId);
    }

    @Post('transaction')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createAquTransaction(@Req() req, @Body() dto: CreateAssetAquTransactionDto) {
        return await this.assetAqService.createAquTransaction(req, dto);
    }

    @Get('transaction')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAllTransaction(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetAquTransDocument>> {
        return await this.assetAqService.findAllAquTransaction(req, paginateOptions);
    }

    @Post('depreciation')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createAquDep(@Req() req, @Body() dto: CreateAssetAquDepDto) {
        return await this.assetAqService.createAquDepreciation(req, dto);
    }

    @Get('depreciation')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async findAllDepreciation(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetAquDepDocument>> {
        return await this.assetAqService.findAllAquDepreciation(req, paginateOptions);
    }
    @Post('retirement')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createAssetRetirement(@Req() req, @Body() dto: CreateAssetRetirementDto) {
        return await this.assetAqService.createAquRetirement(req, dto);
    }

    @Get('retirement')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAllretirement(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetRetirementDocument>> {
        return await this.assetAqService.findAllAssetRetirement(req, paginateOptions);
    }



}
