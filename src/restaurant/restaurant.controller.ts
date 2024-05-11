import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  Req,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { RestaurantDocument } from './schemas/restaurant.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';

@Controller('restaurant')
@ApiTags('Restaurants')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) { }

  @Post()
  @PermissionGuard(PermissionSubject.Restaurant, Permission.Common.CREATE)
  async create(@Req() req, @Body() createRestaurantDto: CreateRestaurantDto) {
    return await this.restaurantService.create(req, createRestaurantDto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Restaurant, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<RestaurantDocument>> {
    return await this.restaurantService.findAll(req, paginateOptions);
  }

  @Get(':restaurantId')
  @PermissionGuard(PermissionSubject.Restaurant, Permission.Common.FETCH)
  async findOne(@Param('restaurantId') restaurantId: string) {
    return await this.restaurantService.findOne(restaurantId);
  }

  @Patch(':restaurantId')
  @PermissionGuard(PermissionSubject.Restaurant, Permission.Common.UPDATE)
  async update(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return await this.restaurantService.update(
      req,
      restaurantId,
      updateRestaurantDto,
    );
  }

  @Delete(':restaurantId')
  @PermissionGuard(PermissionSubject.Restaurant, Permission.Common.DELETE)
  async remove(@Param('restaurantId') restaurantId: string) {
    return await this.restaurantService.remove(restaurantId);
  }

  @Get('all')
  @PermissionGuard(PermissionSubject.Restaurant, Permission.Common.LIST)
  async findAllRestaurant(
    @Req() req,
  ) {
    return await this.restaurantService.findAllRestaurantForSuperAdmin(req);
  }
}
