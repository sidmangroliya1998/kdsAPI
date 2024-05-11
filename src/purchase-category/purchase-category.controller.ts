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
import { PurchaseCategoryService } from './purchase-category.service';
import { CreatePurchaseCategoryDto } from './dto/create-purchase-category.dto';
import { UpdatePurchaseCategoryDto } from './dto/update-purchase-category.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { PaginateResult } from 'mongoose';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PurchaseCategoryDocument } from './schemas/purchase-category.schema';
import { Permission } from 'src/core/Constants/permission.type';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('purchase-category')
@ApiTags('Purchase Category')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class PurchaseCategoryController {
  constructor(
    private readonly purchaseCategoryService: PurchaseCategoryService,
  ) {}

  @Post()
  @PermissionGuard(PermissionSubject.PurchaseCategory, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreatePurchaseCategoryDto) {
    return await this.purchaseCategoryService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.PurchaseCategory, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PurchaseCategoryDocument>> {
    return await this.purchaseCategoryService.findAll(req, paginateOptions);
  }

  @Get(':purchaseCategoryId')
  @PermissionGuard(PermissionSubject.PurchaseCategory, Permission.Common.FETCH)
  async findOne(@Param('purchaseCategoryId') purchaseCategoryId: string) {
    return await this.purchaseCategoryService.findOne(purchaseCategoryId);
  }

  @Patch(':purchaseCategoryId')
  @PermissionGuard(PermissionSubject.PurchaseCategory, Permission.Common.UPDATE)
  async update(
    @Param('purchaseCategoryId') purchaseCategoryId: string,
    @Body() dto: UpdatePurchaseCategoryDto,
  ) {
    return await this.purchaseCategoryService.update(purchaseCategoryId, dto);
  }

  @Delete(':purchaseCategoryId')
  @PermissionGuard(PermissionSubject.PurchaseCategory, Permission.Common.DELETE)
  async remove(@Param('purchaseCategoryId') purchaseCategoryId: string) {
    return await this.purchaseCategoryService.remove(purchaseCategoryId);
  }
}
