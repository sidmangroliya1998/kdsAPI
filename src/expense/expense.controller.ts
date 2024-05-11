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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { ExpenseDocument } from './schemas/expense.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { SalesReportDto } from 'src/reports/dto/sales-report.dto';
import { SkipInterceptor } from 'src/core/decorators/skip-interceptor.decorator';
import { ExpenseReportDto } from './dto/expense-report.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
@Controller('expense')
@ApiTags('Expenses')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) { }

  @Post()
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateExpenseDto) {
    return await this.expenseService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryExpenseDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ExpenseDocument>> {
    return await this.expenseService.findAll(req, query, paginateOptions);
  }

  @Get('report')
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.LIST)
  async report(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
    @Query() query: ExpenseReportDto,
  ): Promise<PaginateResult<ExpenseDocument>> {
    return await this.expenseService.report(req, query, paginateOptions);
  }

  @Get(':expenseId')
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.FETCH)
  async findOne(@Param('expenseId') expenseId: string) {
    return await this.expenseService.findOne(expenseId);
  }

  @Patch(':expenseId')
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.UPDATE)
  async update(
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return await this.expenseService.update(expenseId, dto);
  }

  @Delete(':expenseId')
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.DELETE)
  async remove(@Param('expenseId') expenseId: string) {
    return await this.expenseService.remove(expenseId);
  }

  @Get('export-report')
  @Header('Content-Type', 'application/xlsx')
  @Header('Content-Disposition', 'attachment; filename="expense-report.xlsx"')
  @PermissionGuard(PermissionSubject.Expense, Permission.Common.LIST)
  @SkipInterceptor()
  async exportreport(
    @Req() req,
    @Query() query: ExpenseReportDto,
  ): Promise<PaginateResult<ExpenseDocument>> {
    return await this.expenseService.report(req, query, null, true);
  }

  @Get('process-update/:supplierId')
  @PermissionGuard(PermissionSubject.Purchase, Permission.Common.FETCH)
  async processUpdate(@Param('supplierId') supplierId: string) {
    return await this.expenseService.restoreTotalData(supplierId);
  }

  @Patch('approval/:Id')
  @PermissionGuard(PermissionSubject.Transaction, Permission.Common.MANAGE)
  async updateTransaction(
    @Param('Id') Id: string
  ) {
    return await this.expenseService.updateApproval(Id);
  }

  @Post('transfer-to-new-model')
  // @PermissionGuard(PermissionSubject.ProductionEvent, Permission.Common.CREATE)
  async createNewModelScript(@Req() req) {
    return await this.expenseService.createScript();
  }
}
