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
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { GlVoucherService } from './gl-voucher.service';
import { Permission } from 'src/core/Constants/permission.type';
import { CreateGlVoucherDto } from './dto/create-gl-voucher.dto';
import { GlVoucherDocument } from './schemas/gl-voucher.schema';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { UpdateGlVoucherDto } from './dto/update-gl-voucher.dto';
import { BulkTransferDto } from './dto/bulk-transfer.dto';
import { QueryGlVoucherDto } from './dto/query-gl-voucher.dto';
import { TrialBalanceReportDto } from './dto/trial-balance-report.dto';
import { QueryGlBalanceDto } from './dto/query-gl-balance.dto';
import { CreateGlVoucherHistoryDto } from './dto/create-gl-voucher-history.dto';
import { GlVoucherRecurringService } from './gl-voucher-recurring.service';
import { CreateGlVoucherRecurringDto } from './dto/create-gl-voucher-recurring.dto';
import { GlVoucherRecurringDocument } from './schemas/gl-voucher-recurring.schema';
import { UpdateGlVoucherRecurringDto } from './dto/update-gl-voucher-recurring.dto';

@Controller('gl-voucher')
@ApiTags('Gl Voucher')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlVoucherController {
  constructor(
    private readonly glVoucherService: GlVoucherService,
    private readonly glVoucherRecurringService: GlVoucherRecurringService

  ) { }

  @Post()
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlVoucherDto) {
    return await this.glVoucherService.create(req, dto);
  }

  @Post('transfer')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.CREATE)
  async transfer(@Req() req, @Body() dto: BulkTransferDto) {
    return await this.glVoucherService.transfer(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryGlVoucherDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlVoucherDocument>> {
    return await this.glVoucherService.findAll(req, query, paginateOptions);
  }

  @Get('trial-balance')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.LIST)
  async trialBalance(
    @Req() req,
    @Query() query: TrialBalanceReportDto,
  ): Promise<any> {
    return await this.glVoucherService.trialBalance(req, query);
  }

  @Get(':glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.FETCH)
  async findOne(@Param('glVoucherId') glVoucherId: string) {
    return await this.glVoucherService.findOne(glVoucherId);
  }

  @Patch(':glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.UPDATE)
  async update(
    @Req() req,
    @Param('glVoucherId') glVoucherId: string,
    @Body() dto: UpdateGlVoucherDto,
  ) {
    return await this.glVoucherService.update(req, glVoucherId, dto);
  }


  @Patch('approval/:glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.UPDATE)
  async updateApprovalVoucher(
    @Req() req,
    @Param('glVoucherId') glVoucherId: string,
  ) {
    return await this.glVoucherService.updateApproval(req, glVoucherId);
  }

  @Post('gl-voucher-history')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.UPDATE)
  async addVoucherHistory(
    @Req() req,
    @Body() dto: CreateGlVoucherHistoryDto,
  ) {
    return await this.glVoucherService.createHistoryNotes(req, dto);
  }

  @Patch('gl-voucher-history')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.UPDATE)
  async updateVoucherHistory(
    @Req() req,
    @Body() dto: CreateGlVoucherHistoryDto,
  ) {
    return await this.glVoucherService.updateHistoryNotes(req, dto);
  }

  @Get('gl-voucher-history/:glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.FETCH)
  async findVoucherHistoryOne(@Param('glVoucherId') glVoucherId: string) {
    return await this.glVoucherService.getVoucherHistory(glVoucherId);
  }


  @Patch(':glVoucherId/reverse')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.UPDATE)
  async reverse(@Req() req, @Param('glVoucherId') glVoucherId: string) {
    return await this.glVoucherService.reverse(req, glVoucherId);
  }

  @Delete(':glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.DELETE)
  async remove(@Param('glVoucherId') glVoucherId: string) {
    return await this.glVoucherService.remove(glVoucherId);
  }

  @Get('gl-balance')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.LIST)
  async glBalance(
    @Req() req,
    @Query() query: QueryGlBalanceDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.glVoucherService.glAccountBalanceReport(req, query, paginateOptions);
  }

  @Post('reset-gl-balance')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.LIST)
  async glBalanceSetup(
    @Req() req
  ): Promise<any> {
    return await this.glVoucherService.setupGLAccountBalance(req);
  }

  @Get('all-gl-balance')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.LIST)
  async glAllAccountBalance(
    @Req() req
  ): Promise<any> {
    return await this.glVoucherService.getAllGLAccountBalance(req);
  }

  @Post('transfer-to-new-model')
  // @PermissionGuard(PermissionSubject.ProductionEvent, Permission.Common.CREATE)
  async createNewModelScript(@Req() req): Promise<any> {
    return await this.glVoucherService.createScript();
  }


  //** GL VOUCHER RECURRING CRUD OPERATION*/

  @Post('gl/recurring')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.CREATE)
  async createRecurring(@Req() req, @Body() dto: CreateGlVoucherRecurringDto) {
    return await this.glVoucherRecurringService.create(req, dto);
  }


  @Get('gl/recurring')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.LIST)
  async findAllRecurring(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlVoucherRecurringDocument>> {
    return await this.glVoucherRecurringService.findAll(req, paginateOptions);
  }


  @Get('gl/recurring/:glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.FETCH)
  async findOneRecurring(@Param('glVoucherId') glVoucherId: string) {
    return await this.glVoucherRecurringService.findOne(glVoucherId);
  }



  @Patch('gl/recurring/:glVoucherId')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.UPDATE)
  async updateRecurring(
    @Req() req,
    @Param('glVoucherId') glVoucherId: string,
    @Body() dto: UpdateGlVoucherRecurringDto,
  ) {
    return await this.glVoucherRecurringService.update(req, glVoucherId, dto);
  }

  @Patch('gl/recurring/approval/:Id')
  @PermissionGuard(PermissionSubject.GlVoucher, Permission.Common.MANAGE)
  async updateTransaction(
    @Req() req,
    @Param('Id') Id: string
  ) {
    return await this.glVoucherRecurringService.updateApproval(Id, req);
  }


}
