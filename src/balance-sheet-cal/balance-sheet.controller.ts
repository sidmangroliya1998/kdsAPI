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
import { BalanceSheetService } from "./balance-sheet.service";
import { CreateBalanceSheetTemplateDto } from './dto/create-balance-sheet-template.dto';
import { BalanceSheetTemplateDocument } from './schema/balance-sheet-template.schema';
import { UpdateBalanceSheetTemplateDto } from './dto/update-balance-sheet-template.dto';
import { BalanceSheetReportDto } from './dto/balance-report.dto';



@Controller('Balance-sheet')
@ApiTags('Balance Sheet')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class BalanceSheetController {
    constructor(private readonly balanceService: BalanceSheetService) { }

    @Post('default-template')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.CREATE)
    async createDefault(@Req() req) {
        return await this.balanceService.defaultTemplate(req);
    }

    @Post('template')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateBalanceSheetTemplateDto) {
        return await this.balanceService.createTemplate(req, dto);
    }

    @Get('template')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.LIST)
    async findAll(
        @Req() req,
    ): Promise<BalanceSheetTemplateDocument> {
        return await this.balanceService.findAllTemplate(req);
    }

    @Get('template/:templateId')
    //@PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.FETCH)
    async findOne(@Param('templateId') templateId: string) {
        return await this.balanceService.findOneTemplate(templateId);
    }

    @Patch('template/:templateId')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.UPDATE)
    async update(
        @Param('templateId') templateId: string,
        @Body() dto: UpdateBalanceSheetTemplateDto,
    ) {
        return await this.balanceService.updateTemplate(templateId, dto);
    }

    @Delete('template/:templateId')
    //@PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.DELETE)
    async remove(@Param('templateId') templateId: string) {
        return await this.balanceService.removeTemplate(templateId);
    }

    @Post('report')
    // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.CREATE)
    async createBalanceSheetReport(@Req() req, @Body() dto: BalanceSheetReportDto) {
        return await this.balanceService.createBalanceSheetReport(req, dto);
    }
}