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
import { ManualVendorPaymentService } from './manual-vendor-payment.service';
import { CreateManualVendorPaymentDto } from './dto/create-manual-vendor-payment.dto';
import { UpdateManualVendorPaymentDto } from './dto/update-manual-vendor-payment.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { QueryManualVendorPaymentDto } from './dto/query-manual-vendor-payment.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { ManualVendorPaymentDocument } from './schemas/manual-vendor-payment.schema';
import { PaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('manual-vendor-payment')
@ApiTags('Manual Vendor Payment')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ManualVendorPaymentController {
  constructor(
    private readonly manualVendorPaymentService: ManualVendorPaymentService,
  ) { }

  @Post()
  @PermissionGuard(
    PermissionSubject.ManualVendorPayment,
    Permission.Common.CREATE,
  )
  async create(
    @Req() req,
    @Body() dto: CreateManualVendorPaymentDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorPaymentService.createNew(req, dto, i18n);
  }

  @Get()
  @PermissionGuard(
    PermissionSubject.ManualVendorPayment,
    Permission.Common.LIST,
  )
  async findAll(
    @Req() req,
    @Query() query: QueryManualVendorPaymentDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.manualVendorPaymentService.findAll(
      req,
      query,
      paginateOptions,
    );
  }

  @Get(':manualVendorPaymentId')
  @PermissionGuard(
    PermissionSubject.ManualVendorPayment,
    Permission.Common.FETCH,
  )
  async findOne(
    @Param('manualVendorPaymentId') manualVendorPaymentId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorPaymentService.findOne(
      manualVendorPaymentId,
      i18n,
    );
  }

  @Patch(':manualVendorPaymentId')
  @PermissionGuard(
    PermissionSubject.ManualVendorPayment,
    Permission.Common.UPDATE,
  )
  async update(
    @Param('manualVendorPaymentId') manualVendorPaymentId: string,
    @Body() dto: UpdateManualVendorPaymentDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorPaymentService.update(
      manualVendorPaymentId,
      dto,
      i18n,
    );
  }

  @Delete(':manualVendorPaymentId')
  @PermissionGuard(
    PermissionSubject.ManualVendorPayment,
    Permission.Common.DELETE,
  )
  async remove(
    @Param('manualVendorPaymentId') manualVendorPaymentId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualVendorPaymentService.remove(
      manualVendorPaymentId,
      i18n,
    );
  }

  @Get('irvi')
  @PermissionGuard(
    PermissionSubject.ManualVendorPayment,
    Permission.Common.LIST,
  )
  async findAllIRVI(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.manualVendorPaymentService.findIRVIAll(
      req, paginateOptions);
  }

  @Patch('approval/:Id')
  @PermissionGuard(PermissionSubject.Transaction, Permission.Common.MANAGE)
  async updateTransaction(
    @Req() req,
    @Param('Id') Id: string
  ) {
    return await this.manualVendorPaymentService.updateApproval(req, Id);
  }

}
