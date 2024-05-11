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
  Header,
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CashierService } from './cashier.service';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateCashierDto } from './dto/update-cashier.dto';
import { CashierDocument } from './schemas/cashier.schema';
import {
  CloseCashierDto,
  ExpenseDto,
  OpenCashierDto,
  OverrideCloseCashierDto,
  QueryCashierDto,
} from './dto/cashier-log.dto';
import { CashierLogDocument } from './schemas/cashier-log.schema';
import { CashierLogService } from './cashier-log.service';
import { PauseDto } from './dto/pause.dto';
import {
  CashierLogReportDto,
  CashierReportDto,
} from './dto/cashier-report.dto';
import { SkipInterceptor } from 'src/core/decorators/skip-interceptor.decorator';
import { CashierDashboardDto } from './dto/cashier-dashboard.dto';
import { CashierLogPrintDto } from './dto/cashierlog.dto';
import { EmpDebtService } from 'src/employee-mgmt/service/emp-debt.service';

@Controller('cashier')
@ApiTags('Cashiers')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class CashierController {
  constructor(
    private readonly cashierService: CashierService,
    private readonly cashierLogService: CashierLogService,
    private readonly EmpDebtService: EmpDebtService,
  ) { }

  @Post()
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.CREATE)
  async create(@Req() req, @Body() createCashierDto: CreateCashierDto) {
    return await this.cashierService.create(req, createCashierDto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryCashierDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CashierDocument>> {
    return await this.cashierService.findAll(req, query, paginateOptions);
  }

  @Get(':cashierId')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async findOne(@Param('cashierId') cashierId: string) {
    return await this.cashierService.findOne(cashierId);
  }

  @Patch(':cashierId')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.UPDATE)
  async update(
    @Param('cashierId') cashierId: string,
    @Body() updateCashierDto: UpdateCashierDto,
  ) {
    return await this.cashierService.update(cashierId, updateCashierDto);
  }

  @Post('start')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.START)
  async start(@Req() req, @Body() dto: OpenCashierDto) {
    return await this.cashierLogService.start(req, dto);
  }

  @Post('close')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.CLOSE)
  async close(@Req() req, @Body() dto: CloseCashierDto) {
    return await this.cashierLogService.close(req, dto);
  }

  @Post('override-close')
  @PermissionGuard(
    PermissionSubject.Cashier,
    Permission.Cashier.OverrideCashierClose,
  )
  async overrideClose(@Req() req, @Body() dto: OverrideCloseCashierDto) {
    return await this.cashierLogService.close(req, dto);
  }

  @Post(':cashierId/pause')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.PAUSE)
  async pause(@Param('cashierId') cashierId: string, @Body() dto: PauseDto) {
    return await this.cashierLogService.pause(cashierId, dto);
  }

  @Post(':cashierId/resume')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.RESUME)
  async resume(@Param('cashierId') cashierId: string) {
    return await this.cashierLogService.pause(cashierId);
  }

  @Get(':cashierId/current-log')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async currentLog(@Req() req, @Param('cashierId') cashierId: string) {
    if (req.query && req.query.restaurantId && req.query.restaurantId != '') {
      cashierId = await this.cashierLogService.getCashierIdByRestaurant(req);
    }
    return await this.cashierLogService.current(cashierId);
  }

  @Get(':cashierId/:cashierLogId')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async logById(
    @Param('cashierId') cashierId: string,
    @Param('cashierLogId') cashierLogId: string,
  ) {
    return await this.cashierLogService.singleLog(cashierId, cashierLogId);
  }

  @Get(':cashierId/logs')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async logs(
    @Req() req,
    @Param('cashierId') cashierId: string,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CashierLogDocument>> {
    return await this.cashierLogService.logs(req, cashierId, paginateOptions);
  }

  @Delete(':cashierId')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.DELETE)
  async remove(@Param('cashierId') cashierId: string) {
    return await this.cashierService.remove(cashierId);
  }

  @Post(':cashierId/add-expense')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.CREATE)
  async addExpense(
    @Req() req,
    @Param('cashierId') cashierId: string,
    @Body() dto: ExpenseDto,
  ) {
    return await this.cashierLogService.storeExpense(req, cashierId, dto);
  }

  @Delete(':cashierId/remove-expense/:expenseId')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.CREATE)
  async removeExpense(
    @Req() req,
    @Param('cashierId') cashierId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return await this.cashierLogService.removeExpense(
      req,
      cashierId,
      expenseId,
    );
  }

  @Get(':cashierId/dashboard')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async findDashboard(@Param('cashierId') cashierId: string) {
    return await this.cashierService.findDashboard(cashierId);
  }

  @Get('dashboard')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async findDashboards(@Req() req, @Query() query: CashierDashboardDto) {
    return await this.cashierService.findDashboards(req, query);
  }

  @Get('order-report')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async orderReport(@Req() req, @Query() query: CashierReportDto) {
    return await this.cashierLogService.orderReport(req, query);
  }

  @Get('cashier-report')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async cashierReport(@Req() req, @Query() query: CashierReportDto) {
    return await this.cashierLogService.cashierReport(req, query);
  }

  @Get('cashier-report-paidby')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async cashierReportPaidBy(@Req() req, @Query() query: CashierReportDto) {
    return await this.cashierLogService.cashierReportByUser(req, query);
  }

  @Get('cashier-report-waiter')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async cashierReportWaiter(@Req() req, @Query() query: CashierReportDto) {
    return await this.cashierLogService.cashierReportByWaiter(req, query);
  }

  @Get('print')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async cashierPrint(@Req() req, @Query() query: CashierLogReportDto) {
    return await this.cashierLogService.cashierLogPrint(req, query);
  }

  @Post('print')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async cashierLogPrint(
    @Req() req,
    @Body() dto: CashierLogPrintDto,
  ) {
    return await this.cashierLogService.adhocCashierLogPrint(req, dto);
  }

  @Get('order-report/export')
  @Header('Content-Type', 'application/xlsx')
  @Header('Content-Disposition', 'attachment; filename="cashier.xlsx"')
  @SkipInterceptor()
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async orderReportExport(@Req() req, @Query() query: CashierReportDto) {
    return await this.cashierLogService.orderReport(req, query, true);
  }

  @Get('cashier-report/export')
  @Header('Content-Type', 'application/xlsx')
  @Header('Content-Disposition', 'attachment; filename="cashier.xlsx"')
  @SkipInterceptor()
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async cashierReportExport(@Req() req, @Query() query: CashierReportDto) {
    return await this.cashierLogService.cashierReport(req, query, true);
  }


  @Get('dashboard-detail')
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async findDashboardsDetails(@Req() req, @Query() query: CashierDashboardDto,
    @Query() paginateOptions: PaginationDto) {
    return await this.cashierService.getDashboardWithDetail(req, query, paginateOptions);
  }

}
