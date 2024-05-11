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
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { OpeningBalService } from './opening-bal.service';
import { CreateOpeningBalDto } from './dto/create-opening-bal.dto';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { Permission } from 'src/core/Constants/permission.type';
import { OpeningBalDocument } from './schemas/opening-bal.schema';
import { QueryOpeningBalDto } from './dto/query-opening-bal.dto';

@Controller('opening-bal')
@ApiTags('Opening Balance')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class OpeningBalController {
    constructor(private readonly openingBalService: OpeningBalService) { }

    @Post()
    @PermissionGuard(PermissionSubject.GoodsReceipt, Permission.Common.CREATE)
    async create(
        @Req() req,
        @Body() dto: CreateOpeningBalDto,
    ) {
        return await this.openingBalService.create(req, dto);
    }

    @Get()
    @PermissionGuard(PermissionSubject.GoodsReceipt, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() query: QueryOpeningBalDto,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<OpeningBalDocument>> {
        return await this.openingBalService.findAll(req, query, paginateOptions);
    }

}

