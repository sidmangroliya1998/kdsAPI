import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { InvoiceDocument } from './schemas/invoice.schema';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { EscCommandsDto } from './dto/esc-commands.dto';
import { Public } from 'src/core/decorators/public.decorator';
import { PrintInvoiceDto } from './dto/print-invoice.dto';
import {
  CreateMassInvoiceDto,
  ReduceShishaTaxAndMassInvoiceDto,
} from './dto/create-mass-invoice.dto';
import { QueryOrderDto } from 'src/order/dto/query-order.dto';

@ApiTags('Invoice')
@ApiBearerAuth('access-token')
@Controller('invoice')
@ApiHeader({ name: 'lang' })
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CREATE)
  async create(
    @Request() req,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceDocument> {
    return await this.invoiceService.create(req, dto);
  }

  @Post('invoice-create-batch')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CREATE)
  async massCreate(
    @Request() req,
    @Body() dto: CreateMassInvoiceDto,
  ): Promise<any> {
    return await this.invoiceService.createMassInvoiceBatch(req, dto);
  }

  @Post('reduce-shishatax-batch')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CREATE)
  async createShishaTaxBatch(
    @Request() req,
    @Body() dto: ReduceShishaTaxAndMassInvoiceDto,
  ): Promise<any> {
    return await this.invoiceService.createReduceShishaTaxBatch(req, dto);
  }

  @Post('correct-shishatax-batch')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CREATE)
  async createShishaCorrectionBatch(
    @Request() req,
    @Body() dto: CreateMassInvoiceDto,
  ): Promise<any> {
    return await this.invoiceService.createOrderCorrectionBatch(req, dto);
  }

  @Post('mass-cancel')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CANCEL)
  async massCancel(
    @Request() req,
    @Body() dto: CreateMassInvoiceDto,
  ): Promise<any> {
    return await this.invoiceService.massCancel(req, dto);
  }

  @Post('mass-receipt-delete')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.DELETE)
  async massReceiptDelete(
    @Request() req,
    @Body() dto: CreateMassInvoiceDto,
  ): Promise<any> {
    return await this.invoiceService.massReceiptDelete(req, dto);
  }

  @Get('commands')
  @Public()
  async generateCommands(
    @Request() req,
    @Query() query: EscCommandsDto,
  ): Promise<InvoiceDocument> {
    return await this.invoiceService.generateCommands(req, query);
  }

  @Get('print')
  async print(@Request() req, @Query() query: PrintInvoiceDto): Promise<any> {
    return await this.invoiceService.printInvoice(req, query);
  }

  @Patch(':invoiceId/cancel')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CANCEL)
  async cancel(
    @Request() req,
    @Param('invoiceId') invoiceId: string,
  ): Promise<InvoiceDocument> {
    return await this.invoiceService.cancel(req, invoiceId);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.LIST)
  async all(
    @Request() req,
    @Query() queryInvoice: QueryInvoiceDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InvoiceDocument>> {
    return await this.invoiceService.all(req, queryInvoice, paginateOptions);
  }

  @Post('reduce-shishatax-new')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CREATE)
  async createShishaTaxBatchNew(
    @Request() req,
    @Body() dto: ReduceShishaTaxAndMassInvoiceDto,
  ): Promise<any> {
    return await this.invoiceService.removeShishaTaxNew(req, dto);
  }

  @Post('mass-create-invoice')
  @PermissionGuard(PermissionSubject.Invoice, Permission.Common.CREATE)
  async createMassInvoice(
    @Request() req,
    @Body() dto: QueryOrderDto,
  ): Promise<any> {    
    return await this.invoiceService.massCreateInvoiceNew(req, dto);
  }

}
