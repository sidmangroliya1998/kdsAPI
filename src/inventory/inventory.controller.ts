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
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import {
  UpdateInventoryDto,
  UpdateInventoryIdentifierDto,
} from './dto/update-inventory.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';

import { QueryInventoryDto } from './dto/query-inventory.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { InventoryDocument } from './schemas/inventory.schema';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { QueryInventoryHistoryDto } from './dto/query-inventory-history.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { InventoryTransferDocument } from './schemas/inventory-transfer.schema';
import { InventorySchedulerService } from './inventory-scheduler.service';
import { SalesReportDto } from 'src/reports/dto/sales-report.dto';
import { ItemConsumptionDto } from './dto/item-consumption.dto';
import { TransferInventoryRequestDto } from './dto/transfer-inventory-req.dto';
import { TransferRequestStatus } from './enum/en';
import { UpdateTransferInventoryReqDto } from './dto/transfer-inventory-req-update.dto';
import { InventoryTransferRequestDocument } from './schemas/inventory-transfer-req.schema';
import { TransferInventoryNewDto } from './dto/transfer-inventory-new.dto';
import { InventoryTransferNewDocument } from './schemas/inventory-transfer-new.schema';
import { CreateInventoryCountValueDto } from './dto/create-inv-count-value.dto';
import { QueryInventoryControlDto } from './dto/query-inventory-control-report.dto';

@Controller('inventory')
@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService,
    private readonly invSchService: InventorySchedulerService) { }

  @Post()
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateInventoryDto) {
    return await this.inventoryService.create(req, dto);
  }

  // @Post('transfer')
  // @PermissionGuard(PermissionSubject.Inventory, Permission.Common.CREATE)
  // async transfer(
  //   @Req() req,
  //   @Body() dto: TransferInventoryDto,
  //   @I18n() i18n: I18nContext,
  // ) {
  //   return await this.inventoryService.transferInventory(req, dto, i18n);
  // }

  @Post('transfer')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.CREATE)
  async transfer(
    @Req() req,
    @Body() dto: TransferInventoryNewDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.transferInventoryNew(req, dto, i18n);
  }

  @Get('fetch-transfers')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async fetchTransfers(
    @Req() req,
    @Query() query: QueryInventoryHistoryDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryTransferNewDocument>> {
    return await this.inventoryService.fetchTransfers(
      req,
      query,
      paginateOptions,
    );
  }


  @Get('fetch-transfers/:inventoryId')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async fetchTransfersFindOne(
    @Param('inventoryId') inventoryId: string,
    @I18n() i18n: I18nContext,
  ): Promise<any> {
    return await this.inventoryService.transferInventoryFindOne(
      inventoryId, i18n
    );
  }

  @Get()
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryInventoryDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryDocument>> {
    return await this.inventoryService.findAll(req, query, paginateOptions);
  }

  @Get(':inventoryId')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.FETCH)
  async findOne(
    @Param('inventoryId') inventoryId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.findOne(inventoryId, i18n);
  }

  @Get('history')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.FETCH)
  async history(
    @Req() req,
    @Query() query: QueryInventoryHistoryDto,
    @Query() paginateOptions: PaginationDto,
  ) {
    return await this.inventoryService.fetchHistory(
      req,
      query,
      paginateOptions,
    );
  }

  @Get('low-inventory')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.FETCH)
  async lowInventory(
    @Req() req,
    @Query() query: QueryInventoryHistoryDto,
    @Query() paginateOptions: PaginationDto,
  ) {
    return await this.inventoryService.fetchLowInventory(
      req,
      query,
      paginateOptions,
    );
  }

  @Patch('update')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.UPDATE)
  async update(
    @Query() identifier: UpdateInventoryIdentifierDto,
    @Body() dto: UpdateInventoryDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.update(identifier, dto, i18n);
  }

  @Delete(':inventoryId')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.DELETE)
  async remove(
    @Param('inventoryId') inventoryId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.remove(inventoryId, i18n);
  }
  @Get('scheduler-test-inventory')
  async testInventory() {
    return await this.invSchService.sendMinimumQuantityNotification();
  }

  @Post('item-consumption-report')
  async getConsumptionReport(@Req() req, @Body() dto: ItemConsumptionDto) {
    return await this.inventoryService.itemConsumptionReport(req, dto);
  }

  @Post('transfer-request')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.CREATE)
  async transferRequest(
    @Req() req,
    @Body() dto: TransferInventoryRequestDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.inventoryReqCreate(req, dto);
  }

  @Patch('transfer-request/:inventoryReqId')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.UPDATE)
  async updateTransferRequest(
    @Req() req,
    @Param('inventoryReqId') inventoryReqId: string,
    @Body() dto: UpdateTransferInventoryReqDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.inventoryReqUpdate(req, inventoryReqId, dto, i18n);
  }

  @Patch('transfer-request-change-status/:inventoryReqId')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.UPDATE)
  async updateTransferRequestStatus(
    @Req() req,
    @Param('inventoryReqId') inventoryReqId: string,
    @Body() dto: TransferRequestStatus,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.changeInventoryRequestStatus(req, inventoryReqId, dto, i18n);
  }


  @Get('transfer-request')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async findAllReq(
    @Req() req,
    @Query() query: QueryInventoryDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryTransferRequestDocument>> {
    return await this.inventoryService.findAllInventoryRequest(req, query, paginateOptions);
  }
  @Get('transfer-request/:inventoryReqId')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async findReqById(
    @Req() req,
    @Param('inventoryReqId') inventoryReqId: string,
    @I18n() i18n: I18nContext,
  ): Promise<InventoryTransferRequestDocument> {
    return await this.inventoryService.findByInvReqId(req, inventoryReqId, i18n);
  }

  @Post('transfer-to-new-model')
  async createNewModelScript(@Req() req) {
    return await this.inventoryService.createSTNewScript();
  }

  @Post('calculate-count-value')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.FETCH)
  async calculateCountValue(
    @Req() req,
    @Body() dto: CreateInventoryCountValueDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.inventoryService.getInvCountValue(dto, i18n);
  }


  @Get('report/stock-balance')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async stockBalanceReport(
    @Req() req,
    @Query() query: QueryInventoryDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.inventoryService.stockBalanceReport(req, paginateOptions);
  }

  @Get('report/restaurant-inventory')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async inventoryBalance(
    @Req() req,
    @Query() query: QueryInventoryDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.inventoryService.inventoryRestaurantReport(req, paginateOptions);
  }

  @Get('report/zero-balance-inventory')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async zeroBalanceInventory(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.inventoryService.zeroBalanceReport(req, paginateOptions);
  }

  @Get('report/cost-of-finished-inventory')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async costofFinishedProductInventory(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<any> {
    return await this.inventoryService.costofFinishedProduct(req, paginateOptions);
  }

  @Get('report/inventory-control')
  @PermissionGuard(PermissionSubject.Inventory, Permission.Common.LIST)
  async inventoryControl(
    @Req() req,
    @Query() paginateOptions: QueryInventoryControlDto,
  ): Promise<any> {
    return await this.inventoryService.inventoryControlReport(req, paginateOptions);
  }
}
