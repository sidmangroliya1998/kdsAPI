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
import { AccountingReportTemplateService } from './accounting-report-template.service';
import { CreateAccountingReportTemplateDto } from './dto/create-accounting-report-template.dto';
import { UpdateAccountingReportTemplateDto } from './dto/update-accounting-report-template.dto';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { AccountingReportTemplateDocument } from './schemas/accounting-report-template.schema';
import { ReportDto } from './dto/report.dto';
import { SkipInterceptor } from 'src/core/decorators/skip-interceptor.decorator';

@Controller('accounting-report-template')
@ApiTags('Accounting Report Template')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class AccountingReportTemplateController {
  constructor(
    private readonly accountingReportTemplateService: AccountingReportTemplateService,
  ) {}

  @Post()
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.CREATE,
  )
  async create(@Req() req, @Body() dto: CreateAccountingReportTemplateDto) {
    return await this.accountingReportTemplateService.create(req, dto);
  }

  @Get()
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.LIST,
  )
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<AccountingReportTemplateDocument>> {
    return await this.accountingReportTemplateService.findAll(
      req,
      paginateOptions,
    );
  }

  @Get(':accountingReportTemplateId')
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.FETCH,
  )
  async findOne(
    @Param('accountingReportTemplateId') accountingReportTemplateId: string,
  ) {
    return await this.accountingReportTemplateService.findOne(
      accountingReportTemplateId,
    );
  }

  @Post(':accountingReportTemplateId/execute')
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.FETCH,
  )
  async execute(
    @Param('accountingReportTemplateId') accountingReportTemplateId: string,
    @Req() req,
    @Body() dto: ReportDto,
  ) {
    return await this.accountingReportTemplateService.execute(
      req,
      accountingReportTemplateId,
      dto,
    );
  }

  @Patch(':accountingReportTemplateId')
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.UPDATE,
  )
  async update(
    @Param('accountingReportTemplateId') accountingReportTemplateId: string,
    @Body() dto: UpdateAccountingReportTemplateDto,
  ) {
    return await this.accountingReportTemplateService.update(
      accountingReportTemplateId,
      dto,
    );
  }

  @Delete(':accountingReportTemplateId')
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.DELETE,
  )
  async remove(
    @Param('accountingReportTemplateId') accountingReportTemplateId: string,
  ) {
    return await this.accountingReportTemplateService.remove(
      accountingReportTemplateId,
    );
  }

  @Post(':accountingReportTemplateId/export-report')
  @Header('Content-Type', 'application/xlsx')
  @Header(
    'Content-Disposition',
    'attachment; filename="accounting-report.xlsx"',
  )
  @PermissionGuard(
    PermissionSubject.AccountingReportTemplate,
    Permission.Common.FETCH,
  )
  @SkipInterceptor()
  async exportreport(
    @Param('accountingReportTemplateId') accountingReportTemplateId: string,
    @Req() req,
    @Body() dto: ReportDto,
  ): Promise<any> {
    return await this.accountingReportTemplateService.execute(
      req,
      accountingReportTemplateId,
      dto,
      true,
    );
  }
}
