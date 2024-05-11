import { CreatePrimeCostTemplateDto } from "./dto/create-prime-cost-template.dto";
import { PrimeCostService } from "./prime-cost.service";
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Request,
    Query,
    Req,
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PrimeCostTemplateDocument } from "./schema/prime-cost-template.schema";
import { UpdatePrimeCostTemplateDto } from "./dto/update-prime-cost-template.dto";
import { PrimeCostReportDto } from "./dto/prime-cost-report.dto";


@Controller('prime-cost-setup')
@ApiTags('Prime Cost Setup')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class PrimeCostController {
    constructor(private readonly primeCostService: PrimeCostService) { }

    @Post('default-template')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.CREATE)
    async createDefault(@Req() req) {
        return await this.primeCostService.defaultTemplate(req);
    }

    @Post('template')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreatePrimeCostTemplateDto) {
        return await this.primeCostService.createTemplate(req, dto);
    }

    @Get('template')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.LIST)
    async findAll(
        @Req() req,
    ): Promise<PrimeCostTemplateDocument> {
        return await this.primeCostService.findAllTemplate(req);
    }

    @Get('template/:templateId')
    //@PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.FETCH)
    async findOne(@Param('templateId') templateId: string) {
        return await this.primeCostService.findOneTemplate(templateId);
    }

    @Patch('template/:templateId')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.UPDATE)
    async update(
        @Param('templateId') templateId: string,
        @Body() dto: UpdatePrimeCostTemplateDto,
    ) {
        return await this.primeCostService.updateTemplate(templateId, dto);
    }

    @Delete('template/:templateId')
    //@PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.DELETE)
    async remove(@Param('templateId') templateId: string) {
        return await this.primeCostService.removeTemplate(templateId);
    }

    @Post('prime-report')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.LIST)
    async primeCostreport(
        @Req() req,
        @Body() dto: PrimeCostReportDto,
    ): Promise<any> {
        return await this.primeCostService.createReportFromTemplate(req, dto);
    }

    @Post('weekly-trend-analysis')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.LIST)
    async primeCostTrendreport(
        @Req() req,
        @Body() dto: PrimeCostReportDto,
    ): Promise<any> {
        return await this.primeCostService.createTrendAnalysisReportFromTemplate(req, dto);
    }

}