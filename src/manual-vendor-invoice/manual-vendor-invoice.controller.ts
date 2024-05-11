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
import { ManualVendorInvoiceService } from './manual-vendor-invoice.service';
import { CreateManualVendorInvoiceDto } from './dto/create-manual-vendor-invoice.dto';
import { UpdateManualVendorInvoiceDto } from './dto/update-manual-vendor-invoice.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { QueryManualVendorInvoiceDto } from './dto/query-manual-vendor-invoice.dto';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { ManualVendorInvoiceDocument } from './schemas/manual-vendor-invoice.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('manual-vendor-invoice')
@ApiTags('Manual Vendor Invoice')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ManualVendorInvoiceController {
  constructor(
    private readonly manualVendorInvoiceService: ManualVendorInvoiceService,
  ) { }

  @Post()
  @PermissionGuard(
    PermissionSubject.ManualVendorInvoice,
    Permission.Common.CREATE,
  )
  async create(
    @Req() req,
    @Body() dto: CreateManualVendorInvoiceDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorInvoiceService.create(req, dto, i18n);
  }

  @Get()
  @PermissionGuard(
    PermissionSubject.ManualVendorInvoice,
    Permission.Common.LIST,
  )
  async findAll(
    @Req() req,
    @Query() query: QueryManualVendorInvoiceDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ManualVendorInvoiceDocument>> {
    return await this.manualVendorInvoiceService.findAll(
      req,
      query,
      paginateOptions,
    );
  }

  @Get(':manualVendorInvoiceId')
  @PermissionGuard(
    PermissionSubject.ManualVendorInvoice,
    Permission.Common.FETCH,
  )
  async findOne(
    @Param('manualVendorInvoiceId') manualVendorInvoiceId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorInvoiceService.findOne(
      manualVendorInvoiceId,
      i18n,
    );
  }

  @Patch(':manualVendorInvoiceId')
  @PermissionGuard(
    PermissionSubject.ManualVendorInvoice,
    Permission.Common.UPDATE,
  )
  async update(
    @Param('manualVendorInvoiceId') manualVendorInvoiceId: string,
    @Body() dto: UpdateManualVendorInvoiceDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorInvoiceService.update(
      manualVendorInvoiceId,
      dto,
      i18n,
    );
  }

  @Delete(':manualVendorInvoiceId')
  @PermissionGuard(
    PermissionSubject.ManualVendorInvoice,
    Permission.Common.DELETE,
  )
  async remove(
    @Param('manualVendorInvoiceId') manualVendorInvoiceId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorInvoiceService.remove(
      manualVendorInvoiceId,
      i18n,
    );
  }


  @Patch('return-vi')
  @PermissionGuard(
    PermissionSubject.ManualVendorInvoice,
    Permission.Common.CREATE,
  )
  async creditMemoVendor(
    @Req() req,
    @Body() dto: CreateManualVendorInvoiceDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorInvoiceService.returnVendorInvoice(
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
    return await this.manualVendorInvoiceService.updateApproval(Id);
  }
}
