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
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PurchaseDocument } from './schemas/purchase.schema';
import { PaginateResult } from 'mongoose';
import { ExpenseReportDto } from 'src/expense/dto/expense-report.dto';
import { SkipInterceptor } from 'src/core/decorators/skip-interceptor.decorator';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { QueryPurchaseDto } from './dto/query-purchase.dto';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) { }

  @Post()
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreatePurchaseDto) {
    return await this.purchaseService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryPurchaseDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PurchaseDocument>> {
    return await this.purchaseService.findAll(req, query, paginateOptions);
  }

  @Get('report')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.LIST)
  async report(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
    @Query() query: ExpenseReportDto,
  ): Promise<PaginateResult<PurchaseDocument>> {
    return await this.purchaseService.report(req, query, paginateOptions);
  }

  @Get(':purchaseId')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.FETCH)
  async findOne(@Param('purchaseId') purchaseId: string) {
    return await this.purchaseService.findOne(purchaseId);
  }

  @Patch(':purchaseId')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.UPDATE)
  async update(
    @Param('purchaseId') purchaseId: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return await this.purchaseService.update(purchaseId, dto);
  }

  @Delete(':purchaseId')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.DELETE)
  async remove(@Param('purchaseId') purchaseId: string) {
    return await this.purchaseService.remove(purchaseId);
  }

  @Get('export-report')
  @Header('Content-Type', 'application/xlsx')
  @Header('Content-Disposition', 'attachment; filename="expense-report.xlsx"')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.LIST)
  @SkipInterceptor()
  async exportreport(
    @Req() req,
    @Query() query: ExpenseReportDto,
  ): Promise<PaginateResult<PurchaseDocument>> {
    return await this.purchaseService.report(req, query, null, true);
  }


  @Get('process-update/:supplierId')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.FETCH)
  async processUpdate(@Param('supplierId') supplierId: string) {
    return await this.purchaseService.restoreTotalData(supplierId);
  }

  @Patch('approval/:Id')
  @PermissionGuard(PermissionSubject.Transaction, Permission.Common.MANAGE)
  async updateTransaction(
    @Param('Id') Id: string
  ) {
    return await this.purchaseService.updateApproval(Id);
  }

  @Post('transfer-to-new-model')
  // @PermissionGuard(PermissionSubject.ProductionEvent, Permission.Common.CREATE)
  async createNewModelScript(@Req() req) {
    return await this.purchaseService.createScript();
  }
}
