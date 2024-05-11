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
} from '@nestjs/common';
import { ManualCustomerInvoiceService } from './manual-customer-invoice.service';
import { CreateManualCustomerInvoiceDto } from './dto/create-manual-customer-invoice.dto';
import { UpdateManualCustomerInvoiceDto } from './dto/update-manual-customer-invoice.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { QueryManualCustomerInvoiceDto } from './dto/query-manual-customer-invoice.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { ManualCustomerInvoiceDocument } from './schemas/manual-customer-invoice.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateInvoicePrintDto } from './dto/create-print.dto';

@Controller('manual-customer-invoice')
@ApiTags('Manual Customer Invoice')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ManualCustomerInvoiceController {
  constructor(
    private readonly manualCustomerInvoiceService: ManualCustomerInvoiceService,
  ) { }

  @Post()
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.CREATE,
  )
  async create(
    @Req() req,
    @Body() dto: CreateManualCustomerInvoiceDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerInvoiceService.create(req, dto, i18n);
  }

  @Get()
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.LIST,
  )
  async findAll(
    @Req() req,
    @Query() query: QueryManualCustomerInvoiceDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ManualCustomerInvoiceDocument>> {
    return await this.manualCustomerInvoiceService.findAll(
      req,
      query,
      paginateOptions,
    );
  }

  @Get(':manualCustomerInvoiceId')
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.FETCH,
  )
  async findOne(
    @Param('manualCustomerInvoiceId') manualCustomerInvoiceId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerInvoiceService.findOne(
      manualCustomerInvoiceId,
      i18n,
    );
  }

  @Patch(':manualCustomerInvoiceId')
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.UPDATE,
  )
  async update(
    @Param('manualCustomerInvoiceId') manualCustomerInvoiceId: string,
    @Body() dto: UpdateManualCustomerInvoiceDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerInvoiceService.update(
      manualCustomerInvoiceId,
      dto,
      i18n,
    );
  }

  @Delete(':manualCustomerInvoiceId')
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.DELETE,
  )
  async remove(
    @Param('manualCustomerInvoiceId') manualCustomerInvoiceId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerInvoiceService.remove(
      manualCustomerInvoiceId,
      i18n,
    );
  }


  @Patch('return-ci')
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.CREATE,
  )
  async creditMemoCustomer(
    @Req() req,
    @Body() dto: CreateManualCustomerInvoiceDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerInvoiceService.returnCustomerInvoice(
      req,
      dto,
      i18n,
    );
  }

  @Patch('approval/:Id')
  @PermissionGuard(PermissionSubject.Transaction, Permission.Common.MANAGE)
  async updateTransaction(
    @Param('Id') Id: string
  ) {
    return await this.manualCustomerInvoiceService.updateApproval(Id);
  }

  @Post('print')
  @PermissionGuard(
    PermissionSubject.ManualCustomerInvoice,
    Permission.Common.FETCH,
  )
  async printoremailProcess(
    @Req() req,
    @Body() dto: CreateInvoicePrintDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerInvoiceService.handlePrintAndEmail(dto);
  }

}
