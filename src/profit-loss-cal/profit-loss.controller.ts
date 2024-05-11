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
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ProfitLossService } from "./profit-loss.service";
import { ProfitLossReportDto } from "./dto/profit-loss-report.dto";
import { UpdateProfitLossTemplateDto } from "./dto/update-profit-loss-template";
import { ProfitLossTemplateDocument } from "./schemas/profit-loss-schema";
import { CreateProfitLossTemplateDto } from './dto/create-profit-loss-template.dto';

@Controller('profit-loss')
@ApiTags('Profit Loss Setup')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ProfitLossController {
    constructor(private readonly profitLossService: ProfitLossService) { }

    @Post('default-template')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createDefault(@Req() req) {
        return await this.profitLossService.defaultTemplate(req);
    }

    // @Post('template')
    // // @PermissionGuard(PermissionSubject.PaymentSetup, Permission.Common.CREATE)
    // async create(@Req() req, @Body() dto: CreateProfitLossTemplateDto) {
    //     return await this.profitLossService.createTemplate(req, dto);
    // }

    @Get('template')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAll(
        @Req() req,
    ): Promise<ProfitLossTemplateDocument> {
        return await this.profitLossService.findAllTemplate(req);
    }

    @Get('template/:templateId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOne(@Param('templateId') templateId: string) {
        return await this.profitLossService.findOneTemplate(templateId);
    }

    @Patch('template/:templateId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async update(
        @Param('templateId') templateId: string,
        @Body() dto: UpdateProfitLossTemplateDto,
    ) {
        return await this.profitLossService.updateTemplate(templateId, dto);
    }

    @Delete('template/:templateId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async remove(@Param('templateId') templateId: string) {
        return await this.profitLossService.removeTemplate(templateId);
    }

    @Post('profit-loss-report')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async profitLossReport(
        @Req() req,
        @Body() dto: ProfitLossReportDto,
    ): Promise<any> {
        return await this.profitLossService.createReportFromTemplate(req, dto);
    }
 


}