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
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult  , AggregatePaginateResult} from 'mongoose';
import { DriverDocument } from './schema/driver.schema';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { DriverSummaryDto } from './dto/driver-summary.dto';
import { DriverDetailsDto } from './dto/driver-details-query.dto';
import { UserDocument } from 'src/users/schemas/users.schema';
import { OrderDocument } from 'src/order/schemas/order.schema';

@Controller('driver')
@ApiTags('Drivers')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateDriverDto) {
    return await this.driverService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<DriverDocument>> {
    return await this.driverService.findAll(req, paginateOptions);
  }

  @Get(':driverId')
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.FETCH)
  async findOne(
    @Param('driverId') driverId: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.driverService.findOne(driverId, i18n);
  }

  @Patch(':driverId')
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.UPDATE)
  async update(
    @Param('driverId') driverId: string,
    @Body() dto: UpdateDriverDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.driverService.update(driverId, dto, i18n);
  }

  @Delete(':driverId')
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.DELETE)
  async remove(@Param('driverId') driverId: string, @I18n() i18n: I18nContext) {
    return await this.driverService.remove(driverId, i18n);
  }


  @Get('/summary')
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.LIST)
  async driverSummary(
    @Req() req,
    @Query() query: DriverSummaryDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<[AggregatePaginateResult<UserDocument>]> {
    return await this.driverService.driverSummary(
      req,
      query,
      paginateOptions,
    );
  }

  @Get('/details')
  @PermissionGuard(PermissionSubject.Driver, Permission.Common.FETCH)
  async driverDetails(
    @Req() req,
    @Query() query: DriverDetailsDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    return await this.driverService.driverOrderDetails(req, query, paginateOptions);
  }

}
