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
  BadRequestException
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ChangeOrderDto,
  ChangeTableDto,
  MarketPlaceStatusDto,
  TipDto,
  UpdateOrderDto,
} from './dto/update-order.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { OrderPermissions, PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import {
  Permission,
  PermissionActions,
} from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { OrderDocument } from './schemas/order.schema';
import { PaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  QueryCustomerOrderDto,
  QueryKitchenDisplayDto,
  QueryManualShishaUpdateDto,
  QueryOrderDto,
  RemoveCashOrder,
} from './dto/query-order.dto';
import { MoveOrderItemDto } from './dto/move-order.dto';
import { GroupOrderDto } from './dto/group-order.dto';
import { OrderStatus } from './enum/en.enum';
import {
  ItemPreparedDto,
  KitchenQueueProcessDto,
} from './dto/kitchen-queue-process.dto';
import { ChefInquiryDto } from './dto/chef-inquiry.dto';
import { QueryIdentifyPrinterDto } from './dto/query-identify-printer.dto';
import { Public } from 'src/core/decorators/public.decorator';
import { PermissionService } from '../permission/permission.service';
import { DiscountOrderDto } from './dto/discount-order.dto';
import { Driver } from '../driver/schema/driver.schema';
import { ChangeDeliveryStatusDto } from './dto/change-delivery-status.dto';
import { DriverReportDto } from './dto/driver-report.dto';
import { SkipInterceptor } from 'src/core/decorators/skip-interceptor.decorator';
import { MassActionDto, MassCancelDto } from './dto/mass-action.dto';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';

@Controller('order')
@ApiTags('Orders')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly permissionService: PermissionService,
  ) { }

  @Post()
  @PermissionGuard(PermissionSubject.Order, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateOrderDto) {
    return await this.orderService.create(req, dto);
  }

  @Post('preview')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.CREATE)
  async preview(@Req() req, @Body() dto: CreateOrderDto) {
    return await this.orderService.create(req, dto, true);
  }

  // adding a new route for handling dynamic pricing
  @Post('dynamic-price-preview')
  @PermissionGuard(
    PermissionSubject.Order,
    Permission.Order.DynamicPricePreview || Permission.Common.MANAGE,
  )
  async dynamicPricePreview(@Req() req, @Body() dto: CreateOrderDto) {
    return await this.orderService.create(req, dto, true, true);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Order, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryOrderDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    return await this.orderService.findAll(req, query, paginateOptions);
  }

  @Get('kitchen')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.KitchenDisplay)
  async kitchen(
    @Req() req,
    @Query() query: QueryKitchenDisplayDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    return await this.orderService.kitchenDisplay(req, query, paginateOptions);
  }

  @Post('date')
  @Public()
  async date(@Req() req): Promise<any> {
    return await this.orderService.dateRangeCalculator(req);
  }

  @Get('kitchen-dashboard')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.KitchenDisplay)
  async kitchenDashboard(
    @Req() req,
    @Query() query: QueryKitchenDisplayDto,
  ): Promise<any> {
    return await this.orderService.kitchenDashboard(req, query);
  }

  @Get('customer')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.LIST)
  async findByCustomer(
    @Req() req,
    @Query() query: QueryCustomerOrderDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OrderDocument>> {
    return await this.orderService.findByCustomer(req, query, paginateOptions);
  }

  @Get(':orderId')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.FETCH)
  async findOne(@Param('orderId') orderId: string) {
    return await this.orderService.findOne(orderId);
  }

  @Get('identify-printers')
  async identifyPrinters(@Req() req, @Query() query: QueryIdentifyPrinterDto) {
    return await this.orderService.identifyPrinters(req, query);
  }

  @Patch(':orderId')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.UPDATE)
  async update(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    const checkPermission = await this.permissionService.userHasPermission(
      req.user,
      PermissionSubject.Order,
      Permission.Order.LimitedOrderUpdate,
      true,
    );
    if (checkPermission) {
      return await this.orderService.restrictedUpdate(req, orderId, dto);
    }
    return await this.orderService.update(req, orderId, dto);
  }

  @Patch(':orderId/change')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.Change)
  async change(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: ChangeOrderDto,
  ) {
    const updateDto: UpdateOrderDto = { items: dto.items };
    return await this.orderService.update(req, orderId, updateDto);
  }

  @Patch(':orderId/change-table')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.ChangeTable)
  async changeTable(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: ChangeTableDto,
  ) {
    const updateDto: UpdateOrderDto = { ...dto };
    return await this.orderService.update(req, orderId, updateDto);
  }

  @Patch(':orderId/tip')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.Change)
  async tip(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: TipDto,
  ) {
    const updateDto: UpdateOrderDto = { ...dto };
    return await this.orderService.update(req, orderId, updateDto);
  }

  @Post('apply-discount')
  @PermissionGuard(PermissionSubject.Order, (Permission.Order.ApplyDiscount || Permission.Common.MANAGE))
  async applyDiscount(
    @Req() req,
    @Body() dto: DiscountOrderDto,
  ) {

    const checkPermission = await this.permissionService.userHasPermission(
      req.user,
      PermissionSubject.Order,
      Permission.Order.ApplyDiscount,
      true,
    );

    if (!checkPermission) {
      throw new BadRequestException(
        `${VALIDATION_MESSAGES.PermissionNotAllowed.key}__${OrderPermissions.ApplyDiscount}`,
      );
    }

    return await this.orderService.update(req, dto.orderId, dto);
  }

  @Patch(':orderId/cancel')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.CancelOrder)
  async cancel(@Req() req, @Param('orderId') orderId: string) {
    const checkPermission = await this.permissionService.userHasPermission(
      req.user,
      PermissionSubject.Order,
      Permission.Order.LimitedOrderUpdate,
      true,
    );

    if (checkPermission) {
      return await this.orderService.restrictedUpdate(req, orderId, {
        status: OrderStatus.Cancelled,
      });
    }
    return await this.orderService.update(req, orderId, {
      status: OrderStatus.Cancelled,
    });
  }

  @Patch(':orderId/sent-to-kitchen')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.SentToKitchen)
  async sentToKitchen(@Req() req, @Param('orderId') orderId: string) {
    return await this.orderService.update(req, orderId, {
      status: OrderStatus.SentToKitchen,
    });
  }

  @Patch(':orderId/reset')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.Reset)
  async reset(@Req() req, @Param('orderId') orderId: string) {
    return await this.orderService.update(req, orderId, {
      status: OrderStatus.Reset,
    });
  }

  @Post('masss-reset')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.Reset)
  async massReset(@Req() req, @Body() dto: MassActionDto) {
    return await this.orderService.massReset(req, dto);
  }

  @Post('masss-cancel')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.CancelOrder)
  async massCancel(@Req() req, @Body() dto: MassCancelDto) {
    return await this.orderService.massCancel(req, dto);
  }

  //Comment out to not continue this feature 
  // @Patch(':orderId/on-table')
  // @PermissionGuard(PermissionSubject.Order, Permission.Order.OnTable)
  // async onTable(
  //   @Req() req,
  //   @Param('orderId') orderId: string,
  //   @Body() dto: ItemPreparedDto,
  // ) {
  //   return await this.orderService.update(req, orderId, {
  //     status: OrderStatus.OnTable,
  //     ...dto,
  //   });
  // }

  @Patch(':orderId/add-chef-inquiry-comment')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.ChefInquiry)
  async addChefInquiryComment(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: ChefInquiryDto,
  ) {
    let commentDto = {};
    if (dto.comment) {
      commentDto = {
        $push: {
          chefInquiry: { ...dto, userId: req.user.userId },
        },
      };
    }

    return await this.orderService.generalUpdate(req, orderId, {
      ...dto,
      ...commentDto,
    });
  }

  @Post('move-items')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.UPDATE)
  async moveItems(@Req() req, @Body() dto: MoveOrderItemDto) {
    return await this.orderService.moveItems(req, dto);
  }

  @Post('kitchen-queue-process')
  @PermissionGuard(
    PermissionSubject.Order,
    Permission.Order.KitchenQueueProcess,
  )
  async kitchenQueueProcess(@Req() req, @Body() dto: KitchenQueueProcessDto) {
    return await this.orderService.kitchenQueueProcess(req, dto);
  }

  @Post('group')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.UPDATE)
  async group(@Req() req, @Body() dto: GroupOrderDto) {
    return await this.orderService.groupOrders(req, dto);
  }

  @Post(':orderId/defer')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.Defer)
  async defer(@Req() req, @Param('orderId') orderId: string) {
    return await this.orderService.deferOrder(req, orderId);
  }

  @Patch(':orderId/set-driver/:driverId')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.SetDriver)
  async driver(
    @Req() req,
    @Param('orderId') orderId: string,
    @Param('driverId') driverId: string,
  ) {
    return await this.orderService.update(req, orderId, {
      driverId,
    });
  }

  @Patch(':orderId/remove-driver')
  @PermissionGuard(PermissionSubject.Order, Permission.Order.SetDriver)
  async removeDriver(@Req() req, @Param('orderId') orderId: string) {
    return await this.orderService.update(req, orderId, {
      driverId: null,
    });
  }

  @Patch(':orderId/change-delivery-status')
  @PermissionGuard(
    PermissionSubject.Order,
    Permission.Order.ChangeDeliveryStatus,
  )
  async changeDeliveryStatus(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: ChangeDeliveryStatusDto,
  ) {
    return await this.orderService.update(req, orderId, dto);
  }

  @Patch(':orderId/process-marketplace')
  @PermissionGuard(
    PermissionSubject.Order,
    Permission.Order.ChangeDeliveryStatus,
  )
  async processMarketPlace(
    @Req() req,
    @Param('orderId') orderId: string,
    @Body() dto: MarketPlaceStatusDto,
  ) {
    return await this.orderService.processMarketPlaceOrder(req, orderId, dto);
  }

  @Delete('delete-all/:password')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.DELETE)
  async deleteAll(@Req() req,
    @Param('password') password: string) {
    if (password != 'Talabat@001$') {
      throw new BadRequestException(
        `Invalid Password`,
      );
    } else {
      return await this.orderService.deleteAll(req);
    }
  }

  @Get('driver-report')
  @PermissionGuard(PermissionSubject.Report, Permission.Common.FETCH)
  async cashierReport(@Req() req, @Query() query: DriverReportDto) {
    return await this.orderService.driverReport(req, query);
  }

  @Get('driver-report/export')
  @Header('Content-Type', 'application/xlsx')
  @Header('Content-Disposition', 'attachment; filename="driver.xlsx"')
  @SkipInterceptor()
  @PermissionGuard(PermissionSubject.Cashier, Permission.Common.FETCH)
  async orderReportExport(@Req() req, @Query() query: DriverReportDto) {
    return await this.orderService.driverReport(req, query, true);
  }

  @Post(':supplierId')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.MANAGE)
  async updateManualShisha(@Req() req, @Query() query: QueryManualShishaUpdateDto) {
    return await this.orderService.updateShishaManually(query);
  }

  @Get('get-cash-order-data')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.MANAGE)
  async getAllCashOrder(@Req() req, @Query() query: any) {
    return await this.orderService.cashOrderDataOnly(req, query);
  }

  @Post('remove-cash-order-data')
  @PermissionGuard(PermissionSubject.Order, Permission.Common.MANAGE)
  async removeAllCashOrder(@Req() req, @Query() query: any, @Body() dto: RemoveCashOrder) {
    return await this.orderService.removeCashAmountOrder(req, query, dto);
  }
}
