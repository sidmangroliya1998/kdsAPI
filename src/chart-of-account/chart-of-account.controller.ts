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
    Header,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ChartOfAccountService } from './chart-of-account.service';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { ChartOfAccountDocument } from './schemas/chart-of-account.schema';
import { PaginateResult } from 'mongoose';
import { COAReportDto } from './dto/gl-report.dto';

@Controller('chart-of-account')
@ApiTags('Chart of Account')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ChartOfAccountController {
    constructor(
        private readonly chartofaccountservice: ChartOfAccountService,
    ) { }


    @Post()
    @PermissionGuard(
        PermissionSubject.AccountingReportTemplate,
        Permission.Common.CREATE,
    )
    async create(@Req() req, @Body() dto: CreateChartOfAccountDto) {
        return await this.chartofaccountservice.create(req, dto);
    }

    @Get()
    @PermissionGuard(
        PermissionSubject.AccountingReportTemplate,
        Permission.Common.LIST,
    )
    async findAll(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<ChartOfAccountDocument>> {
        return await this.chartofaccountservice.findAll(
            req,
            paginateOptions,
        );
    }

    @Post('gl-report')
    @PermissionGuard(
        PermissionSubject.AccountingReportTemplate,
        Permission.Common.LIST,
    )
    async generateGLReport(
        @Req() req,
        @Body() dto: COAReportDto

    ): Promise<any> {
        return await this.chartofaccountservice.createCOAReport(
            req,
            dto
        );
    }
    @Post('trial-bal-report')
    @PermissionGuard(
        PermissionSubject.AccountingReportTemplate,
        Permission.Common.LIST,
    )
    async generateTrialBalReport(
        @Req() req,
        @Body() dto: COAReportDto

    ): Promise<any> {
        return await this.chartofaccountservice.createTrialBalReport(
            req,
            dto
        );
    }
}