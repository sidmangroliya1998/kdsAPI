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
import { ManualCustomerPaymentService } from './manual-customer-payment.service';
import { CreateManualCustomerPaymentDto } from './dto/create-manual-customer-payment.dto';
import { UpdateManualCustomerPaymentDto } from './dto/update-manual-customer-payment.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { QueryManualCustomerPaymentDto } from './dto/query-manual-customer-payment.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';

import { ManualCustomerPaymentDocument } from './schemas/manual-customer-payment.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('manual-customer-payment')
@ApiTags('Manual Customer Payment')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class ManualCustomerPaymentController {
  constructor(
    private readonly manualCustomerPaymentService: ManualCustomerPaymentService,
  ) { }

  @Post()
  @PermissionGuard(
    PermissionSubject.ManualCustomerPayment,
    Permission.Common.CREATE,
  )
  async create(
    @Req() req,
    @Body() dto: CreateManualCustomerPaymentDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerPaymentService.create(req, dto, i18n);
  }

  @Get()
  @PermissionGuard(
    PermissionSubject.ManualCustomerPayment,
    Permission.Common.LIST,
  )
  async findAll(
    @Req() req,
    @Query() query: QueryManualCustomerPaymentDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ManualCustomerPaymentDocument>> {
    return await this.manualCustomerPaymentService.findAll(
      req,
      query,
      paginateOptions,
    );
  }

  @Get(':manualCustomerPaymentId')
  @PermissionGuard(
    PermissionSubject.ManualCustomerPayment,
    Permission.Common.FETCH,
  )
  async findOne(
    @Param('manualCustomerPaymentId') manualCustomerPaymentId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerPaymentService.findOne(
      manualCustomerPaymentId,
      i18n,
    );
  }

  @Patch(':manualCustomerPaymentId')
  @PermissionGuard(
    PermissionSubject.ManualCustomerPayment,
    Permission.Common.UPDATE,
  )
  async update(
    @Param('manualCustomerPaymentId') manualCustomerPaymentId: string,
    @Body() dto: UpdateManualCustomerPaymentDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerPaymentService.update(
      manualCustomerPaymentId,
      dto,
      i18n,
    );
  }

  @Delete(':manualCustomerPaymentId')
  @PermissionGuard(
    PermissionSubject.ManualCustomerPayment,
    Permission.Common.DELETE,
  )
  async remove(
    @Param('manualCustomerPaymentId') manualCustomerPaymentId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.manualCustomerPaymentService.remove(
      manualCustomerPaymentId,
      i18n,
    );
  }

  @Patch('approval/:Id')
  @PermissionGuard(PermissionSubject.Transaction, Permission.Common.MANAGE)
  async updateTransaction(
    @Req() req,
    @Param('Id') Id: string
  ) {
    return await this.manualCustomerPaymentService.updateApproval(req, Id);
  }

}
