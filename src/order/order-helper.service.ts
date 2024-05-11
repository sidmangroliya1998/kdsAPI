import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { UpdateOrderDto, UpdateOrderItemDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import {
  Activity,
  ActivityDocument,
} from 'src/activity/schemas/activity.schema';
import {
  MenuAddition,
  MenuAdditionDocument,
} from 'src/menu/schemas/menu-addition.schema';
import {
  InvoiceStatus,
  OrderActivityType,
  OrderPaymentStatus,
  OrderStatus,
  OrderType,
  PreparationStatus,
} from './enum/en.enum';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { CalculationType } from 'src/core/Constants/enum';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Offer, OfferDocument } from 'src/offer/schemas/offer.schema';
import * as moment from 'moment';
import { CreateOrderDto } from './dto/create-order.dto';
import { ActivitySubject, ActivityType } from 'src/activity/enum/activity.enum';
import { CreateActivityDto } from 'src/activity/dto/create-activity.dto';
import { ApplicationType, OfferType } from 'src/offer/enum/en.enum';
import { TableLog, TableLogDocument } from 'src/table/schemas/table-log.schema';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';
import { CalculationService } from './calculation.service';
import { TableStatus } from 'src/table/enum/en.enum';
import { Table } from 'src/table/schemas/table.schema';
import { TableDocument } from 'src/table/schemas/table.schema';
import { SocketIoGateway } from 'src/socket-io/socket-io.gateway';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { TableHelperService } from 'src/table/table-helper.service';
import {
  Customer,
  CustomerDocument,
} from 'src/customer/schemas/customer.schema';
import { WhatsappService } from 'src/core/Providers/http-caller/whatsapp.service';
import { OrderNotificationService } from './order-notification.service';
import { CustomerService } from 'src/customer/customer.service';
import { OrderEvents } from 'src/notification/enum/en.enum';
import { DeliveryService } from 'src/delivery/delivery.service';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';
import { OrderService } from './order.service';
import { PrinterType } from 'src/printer/enum/en';
import { InvoiceHelperService } from 'src/invoice/invoice-helper.service';
import { KitchenQueueProcessDto } from './dto/kitchen-queue-process.dto';
import { TableLogService } from 'src/table/table-log.service';
import { CacheService } from 'src/cache/cache.service';
import {
  MenuCategory,
  MenuCategoryDocument,
} from 'src/menu/schemas/menu-category.schema';
import { Source } from 'src/order/enum/en.enum';
import { CashierLogService } from 'src/cashier/cashier-log.service';
import { CashierHelperService } from '../cashier/cashier-helper.service';
import { BundleItemDto } from './dto/order-item.dto';
import { Bundle, BundleDocument } from 'src/bundle/schemas/bundle.schema';
import { TIMEZONE } from 'src/core/Constants/system.constant';

@Injectable()
export class OrderHelperService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(MenuCategory.name)
    private readonly menuCategoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuAddition.name)
    private readonly menuAdditionModel: Model<MenuAdditionDocument>,
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(TableLog.name)
    private readonly tableLogModel: Model<TableLogDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Bundle.name)
    private readonly bundleModel: Model<BundleDocument>,
    @Inject(forwardRef(() => CalculationService))
    private readonly calculationService: CalculationService,
    private socketGateway: SocketIoGateway,
    private readonly tableHelperService: TableHelperService,
    private readonly orderNotificationService: OrderNotificationService,
    private readonly customerService: CustomerService,
    private readonly deliveryService: DeliveryService,
    private readonly inventoryHelperService: InventoryHelperService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => InvoiceHelperService))
    private readonly invoiceHelperService: InvoiceHelperService,
    private readonly cacheService: CacheService,
    private cashierLogService: CashierLogService,
    private cashierHelpderService: CashierHelperService,
  ) { }

  getMarketPrice(menuItems, dto) {

    if (dto.source === Source.App || dto.source === Source.Website) {
      const updatedMenuItem = menuItems.map((item) => {
        let price = 0;
        //check if restaurantId with pricesForMarkets exists 

        const marketPriceWithRest = item.pricesForMarkets?.find(
          (market) => market?.name === (dto.orderType == OrderType.DineIn ?
            OrderType.DineIn :
            dto?.source) && market?.restaurantId &&
            market?.restaurantId?.toString() == dto.restaurantId?.toString()
        );
        if (marketPriceWithRest && marketPriceWithRest.price > 0) {

          price = marketPriceWithRest.price;
        }
        else {

          const marketPrice = item.pricesForMarkets?.find(
            (market) => market?.name === (dto.orderType == OrderType.DineIn ?
              OrderType.DineIn :
              dto?.source) && (!market?.restaurantId ||
                market?.restaurantId == null)
          );
          if (marketPrice && marketPrice.price > 0) {

            price = marketPrice.price;
          }
        }
        //check if restaurantPrice override option exists
        if (price == 0) {

          if (dto.restaurantId && item?.restaurantPrice && item?.restaurantPrice?.length > 0) {
            const restMenuPrice = item?.restaurantPrice?.find((f: any) => f.restaurantId?.toString() == dto.restaurantId?.toString());

            if (restMenuPrice && restMenuPrice?.cost > 0) {

              price = restMenuPrice?.cost;
            }
            else {

              price = item.price ?? 0;
            }
          }
          else {

            price = item.price ?? 0;
          }
        }
        if (price == 0) {

          price = item.price ?? 0;
        }


        return { ...item, price: price };
      });
      return updatedMenuItem;
    } else if (dto.source === Source.MarketPlace && dto.marketPlaceType) {
      const updatedMenuItem = menuItems.map((item) => {
        const marketPrice = item.pricesForMarkets?.find(
          (market) => market?.name === dto.marketPlaceType,
        );
        let price = item.price ?? 0;
        if (marketPrice && marketPrice.price > 0) price = marketPrice.price;

        return { ...item, price: price };
      });
      return updatedMenuItem;
    }
    return menuItems;
  }

  async prepareOrderItems(
    dto: CreateOrderDto | UpdateOrderDto | any,
    isFromDynamicPrice?: boolean,
  ) {
    // add new flag from dynamic preview route
    const preparedItems = [];
    const taxRate = dto.taxRate;
    const items = dto.items;

    console.log("$$$$ items $$$", JSON.stringify(items));
    //fetch all menu items
    const menuItemIds = items.map((oi) => oi.menuItem.menuItemId);
    let menuItems: any = await this.menuItemModel
      .find({
        _id: { $in: menuItemIds }
        // active: true,
        // deletedAt: null,
      })
      .populate([{ path: 'promotionalGroupedItems.item' }])
      .lean();

    menuItems.forEach((mi) => {
      if (mi.promotionalGroupedItems && mi.promotionalGroupedItems.length > 0) {
        mi.promotionalGroupedItems.forEach((pgi) => {
          if (pgi && pgi.item) {
            items.push({
              menuItem: {
                menuItemId: pgi.item._id,
              },
              quantity: pgi.quantity,
              promotionalItemId: mi._id,
            });
            menuItems.push(pgi.item);
          }
        });
      }
    });



    //step 1: check if MarketPlace with restaurant exists
    //step 2: check if marketplace without restaurant exists
    //step 3: check restaurantPrice 
    //step 4: Common Price

    // update price based upon available markets
    menuItems = this.getMarketPrice(menuItems, dto);

    //fetch all menu additions
    const menuAdditionArr = items.map((oi) => oi?.additions).flat();
    const menuAdditionIds = menuAdditionArr.map((ma) => ma?.menuAdditionId);

    for (const i in items) {
      let discount = 0,
        unitPriceBeforeDiscount = 0,
        unitPriceDiscount = 0,
        unitPriceAfterDiscount = 0,
        itemTaxableAmount = 0,
        tax = 0,
        totalFee = 0,
        subTotal = 0,
        totalShishaSales = 0;
      preparedItems[i] = { ...items[i] };

      // copy menu item attributes needed in order schema
      const menuItem = menuItems.find((mi) => {
        return mi._id.toString() == items[i].menuItem.menuItemId;
      });


      if (
        items[i].price &&
        (menuItem.isDynamicPrice ||
          isFromDynamicPrice ||
          dto.source == Source.MarketPlace) // check if coming from new route dynamic preview route
      ) {
        menuItem.price = items[i].price; // override for marketplace
      }
      if (!menuItem.price) menuItem.price = 0;

      // check if valid menu item
      if (!menuItem)
        throw new NotFoundException(
          `${VALIDATION_MESSAGES.MenuItemNotAvailable.key}__${items[i].menuItem.menuItemId}`,
        );


      // check if the items is soldout
      if (!menuItem.manageQuantity && menuItem.soldOut) {
        throw new BadRequestException(
          `${VALIDATION_MESSAGES.SoldOut.key}__${menuItem.name}`,
        );
      }

      // check the quantity
      if (menuItem.manageQuantity) {
        const availableQuantities = menuItem.quantities.find((q) => {
          return q.restaurantId.toString() == dto.restaurantId;
        });
        if (
          !availableQuantities ||
          availableQuantities.quantity < items[i].quantity
        )
          throw new BadRequestException(
            `${VALIDATION_MESSAGES.SoldOut.key}__${menuItem.name}`,
          );
      }

      // calculate price
      unitPriceBeforeDiscount = menuItem.price;

      discount = 0;
      let offer = null;
      // CHECK ANY COUPON CODE EXISTS

      if (dto.couponCode && dto.couponCode != '') {
        offer = await this.offerModel.findOne(
          {
            supplierId: dto.supplierId,
            code: { $regex: new RegExp('^' + dto.couponCode, 'i') },
            offerType: OfferType.Coupon,
            applicationType: ApplicationType.LineItem,
            $or: [
              { menuCategoryIds: menuItem.categoryId },
              { menuItemIds: menuItem._id },
            ],
            active: true,
            deletedAt: null,
            start: {
              $lte: new Date(moment.utc().format('YYYY-MM-DD')),
            },
            end: {
              $gte: new Date(moment.utc().format('YYYY-MM-DD')),
            }
          },
          {},
          { sort: { priority: 1 } },
        );

      }
      else {
        // CHECK PROMOTION
        offer = await this.offerModel.findOne(
          {
            supplierId: dto.supplierId,
            $or: [
              { menuCategoryIds: menuItem.categoryId },
              { menuItemIds: menuItem._id },
            ],
            active: true,
            deletedAt: null,
            start: {
              $lte: new Date(moment.utc().format('YYYY-MM-DD')),
            },
            end: {
              $gte: new Date(moment.utc().format('YYYY-MM-DD')),
            },
            applicationType: ApplicationType.LineItem,
            offerType: OfferType.Promotion,
          },
          {},
          { sort: { priority: 1 } },
        );
      }

      if (
        offer &&
        offer.maxNumberAllowed && offer.maxNumberAllowed > 0 &&
        offer.maxNumberAllowed <= offer.totalUsed
      ) {
        offer = null;
      }
      else if (offer && offer.maxDiscount > 0 &&
        offer.maxDiscount <= offer.totalAmountUsed
      ) {
        offer = null;
      }


      if (offer != null) {
        preparedItems[i].couponCode = offer.code;
      }


      if (offer) {
        console.log("apply offer", offer)
        discount =
          offer.discountType == CalculationType.Fixed
            ? offer.discount
            : roundOffNumber((menuItem.price * offer.discount) / 100);
        discount = offer.maxDiscount
          ? discount > offer.maxDiscount
            ? offer.maxDiscount
            : discount
          : discount;
        unitPriceDiscount =
          discount /
          (offer.applicationType == ApplicationType.ManagerLineItem
            ? items[i].quantity
            : 1);
      }
      console.log("unitPriceBeforeDiscount", unitPriceBeforeDiscount)
      unitPriceAfterDiscount = unitPriceBeforeDiscount > unitPriceDiscount ?
        unitPriceBeforeDiscount - unitPriceDiscount : 0;

      console.log("unitPriceAfterDiscount", unitPriceAfterDiscount)
      itemTaxableAmount = unitPriceAfterDiscount * items[i].quantity;

      let category = await this.menuCategoryModel
        .findById(menuItem.categoryId?.toString())
        .lean();

      // apply tax
      if (menuItem.taxEnabled) {
        const shishaCal = this.calculateShishaFees(itemTaxableAmount, items[i].quantity, taxRate, category?.feeRate > 0);

        console.log("shishaCal", shishaCal);

        // tax = itemTaxableAmount * ((taxRate / 100) / (1 + taxRate / 100));
        // itemTaxableAmount = itemTaxableAmount - tax;
        // totalFee = Math.max((itemTaxableAmount / items[i].quantity) / 2, 25);
        // totalFee = totalFee * items[i].quantity;
        // subTotal = itemTaxableAmount - totalFee;
        tax = shishaCal.tax;
        itemTaxableAmount = shishaCal.itemTaxableAmount;
        totalFee = shishaCal.totalFee;
        subTotal = shishaCal.subTotal
      }

      preparedItems[i].menuItem = {
        ...items[i].menuItem,
        ...menuItem,
        unitPriceBeforeDiscount: roundOffNumber(unitPriceBeforeDiscount),
        //quantity: items[i].quantity,
        amountBeforeDiscount: roundOffNumber(
          unitPriceBeforeDiscount * items[i].quantity,
        ),
        unitPriceDiscount: roundOffNumber(unitPriceDiscount),
        discount: roundOffNumber(unitPriceDiscount * items[i].quantity),
        unitPriceAfterDiscount: roundOffNumber(unitPriceAfterDiscount),
        amountAfterDiscount: roundOffNumber(
          unitPriceAfterDiscount * items[i].quantity,
        ),
        itemTaxableAmount: roundOffNumber(itemTaxableAmount),
        tax: roundOffNumber(tax),
        totalFee: roundOffNumber(totalFee),
        subTotal: roundOffNumber(subTotal)

      };

      //prepare additions
      const preparedAdditions = [];
      const additions = items[i].additions ?? [];

      console.log("$$$$$$ additions $$$$$$$", JSON.stringify(additions));
      // copy menu addition attributes needed in order schema
      for (const j in additions) {
        // const menuAddition = menuAdditions.find((ma) => {
        //   return ma._id.toString() == additions[j].menuAdditionId.toString();
        // });

        console.log("$$$$ j $$$$", JSON.stringify(j));
        let menuAddition = await this.cacheService.get(
          additions[j].menuAdditionId?.toString(),
        );
        if (!menuAddition) {
          menuAddition = await this.menuAdditionModel
            .findById(additions[j].menuAdditionId)
            .lean();
          if (menuAddition) {
            await this.cacheService.set(
              menuAddition._id.toString(),
              menuAddition,
            );
          } else {
            continue;
          }
        }
        preparedAdditions[j] = {
          ...additions[j],
          ...menuAddition,
        };
        if (additions[j].options) {
          // only set the selected options
          console.log("additions[j].options", JSON.stringify(additions[j].options));
          const additionOptionIds = additions[j].options.map((ao) =>
            ao.optionId?.toString(),
          );
          preparedAdditions[j].options = menuAddition.options.filter((mao) => {
            return additionOptionIds.includes(mao._id?.toString());
          });

          // storing tax,price details for each option and calculating net price

          preparedAdditions[j].options.forEach((o) => {
            console.log("$$$$$$$$$$c o", o);
            let optionPrice = o.price;
            let optionQty = 1;
            if (additions[j].options.find((f: any) => f.optionId == o._id?.toString())?.perItemQuantity &&
              additions[j].options.find((f: any) => f.optionId == o._id?.toString())?.perItemQuantity > 1) {
              optionQty = additions[j].options.find((f: any) => f.optionId == o._id?.toString())?.perItemQuantity;
            }

            o.perItemQuantity = optionQty;
            o.quantity = optionQty * items[i].quantity;
            
            if (dto.source === Source.App || dto.source === Source.Website) {
              const marketPrice = o?.marketPrices?.find(
                (market) => market?.name === dto?.source,
              );

              if (marketPrice && marketPrice.price > 0)
                optionPrice = marketPrice.price;
            } else if (
              dto.source === Source.MarketPlace &&
              dto.marketPlaceType
            ) {
              const marketPrice = o?.marketPrices?.find(
                (market) => market?.name === dto?.marketPlaceType,
              );

              if (marketPrice && marketPrice.price > 0)
                optionPrice = marketPrice.price;
            }

            // console.log("$$$$$$$ optionPrice", optionPrice);
            o.price = optionPrice * optionQty;

            o.optionId = o._id;
            const reqOptionObj = additions[j].options.find(
              (rao) =>
                rao.optionId == o._id.toString() &&
                dto.source == Source.MarketPlace,
            );
            const option = {
              discount: 0,
              unitPriceDiscount: 0,
              unitPriceBeforeDiscount: 0,
              itemTaxableAmount: 0,
              tax: 0,
            };

            // calculate for each option
            option.unitPriceBeforeDiscount =
              reqOptionObj?.price &&
                (isFromDynamicPrice || dto.source === Source.MarketPlace)
                ? reqOptionObj?.price
                : o.price ?? 0;

            option.itemTaxableAmount =
              option.unitPriceBeforeDiscount * items[i].quantity;


            console.log("$$$$$$$ option itemTaxableAmount", option.itemTaxableAmount);
            // set in option obj of DB
            o.unitPriceBeforeDiscount = roundOffNumber(
              option.unitPriceBeforeDiscount,
            );
            o.amountBeforeDiscount = roundOffNumber(
              option.unitPriceBeforeDiscount * items[i].quantity,
            );
            if (menuAddition.taxEnabled) {
              console.log("option.amountBeforeDiscount", o.amountBeforeDiscount);
              option.tax = o.amountBeforeDiscount * ((taxRate / 100) / (1 + taxRate / 100));
              console.log("option.tax", option.tax);
              option.itemTaxableAmount = o.amountBeforeDiscount - option.tax;
              console.log("option.itemTaxableAmount", option.itemTaxableAmount);
            }
            o.unitPriceDiscount = 0;
            o.discount = 0;
            o.unitPriceAfterDiscount = o.unitPriceBeforeDiscount;
            o.amountAfterDiscount = o.amountBeforeDiscount;
            o.itemTaxableAmount = roundOffNumber(option.itemTaxableAmount);
            o.tax = roundOffNumber(option.tax);

            // add option price to item
            unitPriceBeforeDiscount += option.unitPriceBeforeDiscount;
            unitPriceAfterDiscount += option.unitPriceBeforeDiscount;
            itemTaxableAmount += option.itemTaxableAmount;
            tax += option.tax;
            subTotal += option.itemTaxableAmount;
          });
        }
      }
      // set for each order item in database
      if (menuItem?.promotionalGroupedItems?.length > 0) {
        preparedItems[i].isGrouped = true;
      }
      preparedItems[i].additions = preparedAdditions;
      preparedItems[i].unitPriceBeforeDiscount = roundOffNumber(
        unitPriceBeforeDiscount,
      );
      preparedItems[i].amountBeforeDiscount = roundOffNumber(
        unitPriceBeforeDiscount * preparedItems[i].quantity,
      );
      preparedItems[i].unitPriceDiscount = roundOffNumber(unitPriceDiscount);
      preparedItems[i].discount = roundOffNumber(
        unitPriceDiscount * preparedItems[i].quantity,
      );
      preparedItems[i].unitPriceAfterDiscount = roundOffNumber(
        unitPriceAfterDiscount,
      );
      preparedItems[i].amountAfterDiscount = roundOffNumber(
        unitPriceAfterDiscount * preparedItems[i].quantity,
      );
      preparedItems[i].itemTaxableAmount = roundOffNumber(itemTaxableAmount);
      preparedItems[i].tax = roundOffNumber(tax);
      preparedItems[i].preparationTime = roundOffNumber(
        preparedItems[i].menuItem.preparationTime * preparedItems[i].quantity,
      );
      preparedItems[i].totalFee = roundOffNumber(totalFee);
      preparedItems[i].subTotal = roundOffNumber(subTotal);


      if (category?.feeRate > 0) {
        preparedItems[i].menuItem.feeRate = category?.feeRate;
        preparedItems[i].totalShishaSales = roundOffNumber(preparedItems[i].amountAfterDiscount);
      } else {
        preparedItems[i].totalFee = 0;
        preparedItems[i].totalShishaSales = 0;
      }
      preparedItems[i].kitchenQueueId =
        category?.kitchenQueueId ?? dto.kitchenQueueId ?? null;
    }
    console.log("PreparedItems done");

    return preparedItems;
  }

  async prepareBundleItems(
    dto: CreateOrderDto | UpdateOrderDto | any,
    isFromDynamicPrice?: boolean,
    forceAllowed: boolean = false
  ) {
    // add new flag from dynamic preview route
    const preparedItems = [];
    const taxRate = dto.taxRate;
    const bundles: BundleItemDto[] = dto.bundles;

    const menuItemIds = bundles
      .map((b) => b.bundleSubGroups).flat()
      .map((sg) => sg.items)
      .flat()
      .map((i) => i.menuItemId);

    const bundleIds = bundles.map((b) => b.bundleId);

    const menuItems: any = await this.menuItemModel.find({
      _id: { $in: menuItemIds },
      // active: true,
      // deletedAt: null,
    }).lean();

    const bundleObjs: any = await this.bundleModel
      .find({
        _id: { $in: bundleIds },
      })
      .lean();
    if (!bundleObjs) {
      console.log("bundle does not exists order id", dto._id);
      return dto.bundles;
    }
    //fetch all menu additions
    const menuAdditionIds = bundles
      .map((b) => b?.bundleSubGroups)
      .flat()
      .map((sg) => sg?.additions)
      .flat()
      .map((a) => a?.menuAdditionId);
    let isShishaFeeApplicable: boolean = false;

    for (const i in bundles) {
      let discount = 0,
        unitPriceBeforeDiscount = 0,
        unitPriceDiscount = 0,
        unitPriceAfterDiscount = 0,
        itemTaxableAmount = 0,
        tax = 0,
        totalFee = 0,
        subTotal = 0,
        bundlePrice = 0,
        totalAmountOfItems = 0,
        totalShishaSales = 0;



      for (const x in bundles[i].bundleSubGroups) {
        for (let bp = 0; bp < bundles[i].bundleSubGroups[x]['items']?.length; bp++) {
          totalAmountOfItems += ((menuItems.find(
            (menuItem) => menuItem._id.toString() == bundles[i].bundleSubGroups[x]['items'][bp].menuItemId
          )?.price) * (bundles[i].bundleSubGroups[x]['items'][bp].quantity));
        }
      }

      const bundleObj: BundleDocument = Object.assign(
        {},
        bundleObjs.find((b) => b._id.toString() == bundles[i].bundleId),
      );

      // check if valid menu item
      if (bundleObj && bundleObj._id) {
        if (bundleObj.offerValidity) {
          const fromArr =
            bundleObj.offerValidity.validTime?.startTime?.split(':');
          const toArr = bundleObj.offerValidity.validTime?.endTime?.split(':');
          const startDate = moment(bundleObj.offerValidity.startDate)
            .tz(TIMEZONE)
            .set({
              hour: fromArr?.length == 2 ? parseInt(fromArr[0]) : 0,
              minute: fromArr?.length == 2 ? parseInt(fromArr[1]) : 0,
            });

          const endDate = moment(bundleObj.offerValidity.endDate)
            .tz(TIMEZONE)
            .set({
              hour: toArr?.length == 2 ? parseInt(toArr[0]) : 0,
              minute: toArr?.length == 2 ? parseInt(toArr[1]) : 0,
            });
          const currentDate = moment().tz(TIMEZONE);

          if (!forceAllowed &&
            !(
              currentDate.isSameOrAfter(startDate) &&
              currentDate.isSameOrBefore(endDate)
            )
          ) {
            throw new BadRequestException(
              `Bundle ${bundles[i].bundleId} is allowed from ${startDate} to ${endDate}`,
            );
          }
        }
        bundlePrice = bundleObj.price;

        const bundleSubGroups = [];
        for (const j in bundles[i].bundleSubGroups) {
          let quantity = 0;
          const bundleSubGroupObj = Object.assign(
            {},
            bundleObj.subGroups.find((sg) => {
              return (
                bundles[i].bundleSubGroups[j].bundleSubGroupId ==
                sg._id.toString()
              );
            }),
          );
          if (!bundleSubGroupObj._id) {
            throw new NotFoundException(
              `Subgroup ${bundles[i].bundleSubGroups[j].bundleSubGroupId} not found`,
            );
          }
          const subGroupMenuItems = [];

          for (const index in bundles[i].bundleSubGroups[j].items) {

            const sgi = bundles[i].bundleSubGroups[j].items[index];
            const menuItemObj = menuItems.find(
              (menuItem) => menuItem._id.toString() == sgi.menuItemId,
            );

            if (!menuItemObj) {
              throw new NotFoundException(`MenuItem ${sgi.menuItemId} not found`);
            } else if (
              bundleSubGroupObj.items.findIndex(
                (i) => i.toString() == menuItemObj._id.toString(),
              ) == -1
            ) {
              throw new NotFoundException(
                `MenuItem ${sgi.menuItemId} not allowed`,
              );
            }

            let category = await this.cacheService.get(
              menuItemObj.categoryId?.toString(),
            );

            if (!category) {
              category = await this.menuCategoryModel
                .findById(menuItemObj.categoryId?.toString())
                .lean();
              if (category) {
                await this.cacheService.set(
                  menuItemObj.categoryId.toString(),
                  category,
                );
              }
            }
            let bundleRatioAmount = (menuItemObj.price * sgi.quantity) / totalAmountOfItems;


            let upriceBeforeDiscount = 0;
            let utax = 0;
            let uitemTaxableAmount = 0;
            let utotalFee = 0;
            let usubtotal = 0;
            let ushishaSales = 0;

            upriceBeforeDiscount = (bundleObj.price * bundleRatioAmount);
            unitPriceBeforeDiscount += upriceBeforeDiscount;
            unitPriceAfterDiscount += upriceBeforeDiscount;

            uitemTaxableAmount = upriceBeforeDiscount;
            // apply tax



            // if () {
            // console.log("I am in feeRate part");
            // console.log("I am in feeRate part", uitemTaxableAmount);

            const shishaCal = this.calculateShishaFees(uitemTaxableAmount, sgi.quantity, taxRate, category?.feeRate > 0);

            // console.log("shishaCal", shishaCal);
            utax = shishaCal.tax;
            uitemTaxableAmount = shishaCal.itemTaxableAmount;
            utotalFee = shishaCal.totalFee;
            usubtotal = shishaCal.subTotal;

            // utotalFee = Math.max(uitemTaxableAmount / 2, 25)
            totalFee += utotalFee;
            // usubtotal = uitemTaxableAmount - utotalFee;
            subTotal += usubtotal;
            isShishaFeeApplicable = true;
            ushishaSales = category?.feeRate > 0 ? upriceBeforeDiscount : 0;
            totalShishaSales += ushishaSales;
            itemTaxableAmount += uitemTaxableAmount;
            tax += utax;

            // }

            // else {
            //   console.log("I am in else feeRate part");
            //   usubtotal = uitemTaxableAmount;
            //   subTotal += usubtotal;
            //   ushishaSales = 0;
            //   utax = (uitemTaxableAmount) * ((taxRate / 100) / (1 + taxRate / 100));
            //   uitemTaxableAmount = uitemTaxableAmount - utax;
            //   itemTaxableAmount += uitemTaxableAmount;
            //   tax += utax;
            // }
            quantity += sgi.quantity;

            const preparedAdditions = [];
            // if (bundles[i].bundleSubGroups[j].items[index].additions) {
            //   const additions = bundles[i].bundleSubGroups[j].items[index].additions;
            //   for (const k in additions) {
            //     const menuaddId = bundles[i].bundleSubGroups[j].items[index].additions[k].menuAdditionId;

            //     let menuAddition = await this.cacheService.get(
            //       menuaddId?.toString(),
            //     );
            //     if (!menuAddition) {
            //       menuAddition = await this.menuAdditionModel
            //         .findById(menuaddId)
            //         .lean();
            //       if (menuAddition) {
            //         await this.cacheService.set(
            //           menuAddition._id.toString(),
            //           menuAddition,
            //         );
            //       } else {
            //         continue;
            //       }
            //     }
            //     if (menuAddition?.options) {
            //       const additionOptionIds = bundles[i].bundleSubGroups[j].items[index].additions[k].options.map((ao) =>
            //         ao.optionId?.toString(),
            //       );
            //       menuAddition.options = menuAddition.options.filter(
            //         (mao) => {
            //           return additionOptionIds.includes(mao._id?.toString());
            //         },
            //       );
            //     }
            //     preparedAdditions.push(menuAddition);
            //   }
            // }

            subGroupMenuItems.push({
              ...sgi,
              ...menuItemObj,
              kitchenQueueId:
                category?.kitchenQueueId ?? dto.kitchenQueueId ?? null,
              totalFee: utotalFee,
              subTotal: usubtotal,
              tax: utax,
              unitPriceBeforeDiscount: upriceBeforeDiscount,
              unitPriceAfterDiscount: upriceBeforeDiscount,
              itemTaxableAmount: uitemTaxableAmount,
              totalShishaSales: ushishaSales,
              additions: []
            });
          }

          // console.log("subGroupMenuItems", subGroupMenuItems);

          if (quantity > bundleSubGroupObj.maxAllowedQuantities) {
            throw new NotFoundException(
              `Max ${bundleSubGroupObj.maxAllowedQuantities} are allowed for ${bundleSubGroupObj.name}`,
            );
          }

          delete bundleSubGroupObj._id;

          const bundleSubGroup = {
            ...bundles[i].bundleSubGroups[j],
            ...bundleSubGroupObj,
            items: subGroupMenuItems,
            additions: [],
          };
          bundleSubGroups.push(bundleSubGroup);
        }
        delete bundleObj._id;
        preparedItems[i] = {
          ...bundles[i],
          ...bundleObj,
          bundleSubGroups,
          isShishaFeeApplicable: isShishaFeeApplicable
        };

        preparedItems[i].unitPriceBeforeDiscount = roundOffNumber(
          unitPriceBeforeDiscount,
        );
        preparedItems[i].amountBeforeDiscount = roundOffNumber(
          unitPriceBeforeDiscount * preparedItems[i].quantity,
        );
        preparedItems[i].unitPriceDiscount = roundOffNumber(unitPriceDiscount);
        preparedItems[i].discount = roundOffNumber(
          unitPriceDiscount * preparedItems[i].quantity,
        );
        preparedItems[i].unitPriceAfterDiscount = roundOffNumber(
          unitPriceAfterDiscount,
        );

        preparedItems[i].amountAfterDiscount = roundOffNumber(
          unitPriceAfterDiscount * preparedItems[i].quantity,
        );
        preparedItems[i].itemTaxableAmount = roundOffNumber(itemTaxableAmount);

        preparedItems[i].tax = roundOffNumber(tax * preparedItems[i].quantity);
        preparedItems[i].totalFee = roundOffNumber(totalFee * preparedItems[i].quantity);
        preparedItems[i].subTotal = roundOffNumber(subTotal * preparedItems[i].quantity);
        preparedItems[i].totalShishaSales = roundOffNumber(totalShishaSales * preparedItems[i].quantity);
      }
      //throw new NotFoundException(`Bundle ${bundles[i].bundleId} not found`);
      // check if valid

    }

    //console.log("preparedItems Bundle", preparedItems);

    return preparedItems;
  }

  async postOrderCreate(req, order: OrderDocument) {
    // commenting the  schedule activities
    // if (order.isScheduled)
    //   this.calculationService.identifyOrdersToRecalculateForScheduled(order);
    // store activity

    // notify for new pickup or delivery order

    this.socketGateway.emit(
      order.supplierId.toString(),
      SocketEvents.OrderCreated,
      order.toObject(),
    );

    // if (!order.isGrouped)
    //   // manage inventory
    //   this.manageInventory(order);

    if (req.user.isCustomer) {
      const customer = await this.customerModel.findById(req.user.userId);
      if (customer) {
        order.customerId = customer._id;
        order.contactNumber = customer.phoneNumber;
        order.name = customer.name;
        order.save();

        if (order.orderType == OrderType.Delivery) {
          customer.deliveryAddress = order.deliveryAddress;
          customer.save();
        }
      }
    }

    if (order.sittingStartTime)
      this.storeOrderStateActivity(
        order,
        OrderActivityType.SittingStart,
        order.sittingStartTime,
      );
    if (order.menuQrCodeScannedTime)
      this.storeOrderStateActivity(
        order,
        OrderActivityType.MenuScanned,
        order.menuQrCodeScannedTime,
      );
    this.storeOrderStateActivity(
      order,
      OrderActivityType.OrderPlaced,
      order.createdAt,
    );

    // notify customer
    this.orderNotificationService.triggerOrderNotification(
      OrderEvents.OrderCreated,
      order,
    );

    // increment coupon usage
    if (order.couponCode && order.couponCode != '') {
      this.postCouponUsage(order.couponCode, order?.summary?.discount)
    };

    // increament line item coupon usage
    for (let i = 0; i < order.items.length; i++) {
      const el = order.items[i];
      if (el?.couponCode && el?.couponCode != '') {
        this.postCouponUsage(el?.couponCode, el?.discount);
      }
    }

    //auto assign waiter and kitchen queue
    // if (order.orderType == OrderType.DineIn) {
    // }
    // update the table log
    if (order.tableId) {
      const tableLog =
        await this.tableHelperService.addOrderToTableLogWithAutoStart(order);
    }

    // log to cashier
    const cashierId = await this.cashierHelpderService.resolveCashierId(
      req,
      null,
      true,
      order.restaurantId,
    );
    console.log('Before Current', cashierId);
    const cashierLog = await this.cashierLogService.current(cashierId, true);
    order.cashierLogId = cashierLog._id;
    order.save();
  }

  async postOrderUpdate(
    order: OrderDocument,
    dto: UpdateOrderDto,
    beforeUpdate: OrderDocument = null,
  ) {
    // store activity
    if (dto.status) {
      if (dto.status == OrderStatus.SentToKitchen) {
        this.storeOrderStateActivity(
          order,
          OrderActivityType.SentToKitchen,
          order.sentToKitchenTime,
        );
        if (!order.isScheduled) {
          // order.preparationDetails =
          //   await this.calculationService.calculateOrderPreparationTiming(
          //     order,
          //     OrderStatus.SentToKitchen,
          //   );
          // await order.save();
          // this.calculationService.identifyOrdersToRecalculateAfterSentToKitchen(
          //   order,
          // );
        } else {
          // commenting the  schedule activities
          // this.calculationService.identifyOrdersToRecalculateForScheduled(
          //   order,
          //   OrderStatus.SentToKitchen,
          // );
        }
        // generate kitchen receipt
        this.generateKitchenReceipts(order);
        this.notifyKitchenQueue(order);
      } else if (dto.status == OrderStatus.OnTable) {
        this.storeOrderStateActivity(
          order,
          OrderActivityType.OrderReady,
          order.orderReadyTime,
        );
        if (order.tableId) {
          this.tableHelperService.handleReadyFlag(order);
        }
      } else if (
        dto.status == OrderStatus.Cancelled ||
        dto.status == OrderStatus.CancelledWihPaymentFailed ||
        dto.status == OrderStatus.CancelledByMerge
      ) {
        // this.storeOrderStateActivity(
        //   order,
        //   OrderActivityType.OrderReady,
        //   order.orderReadyTime,
        // );
        if (order.orderType == OrderType.Delivery)
          this.deliveryService.cancel(order._id.toString());
        // this.calculationService.identifyOrdersToRecalculateAfterCompleted(
        //   order,
        // );
        if (order.invoiceStatus == InvoiceStatus.Invoiced) {
          await this.invoiceHelperService.regenerateInvoice(order, true);
        }
      } else {
        // check if needs to recalculate the order timing
        // if ([OrderStatus.New, OrderStatus.SentToKitchen].includes(order.status))
        //   this.calculationService.handleOrderPreparationAfterUpdate(order);
      }
      this.orderNotificationService.triggerOrderNotification(dto.status, order);
      //this.orderNotificationService.triggerOrderNotification(order);
    }

    if (dto.tableId) {
      this.tableHelperService.handleTableTransfer(order, beforeUpdate.tableId);
    }

    if (!order.customerId && order.contactNumber) {
      this.setCustomer(order);
    }

    if (
      (dto.items || dto.couponCode) &&
      order.invoiceStatus == InvoiceStatus.Invoiced
    ) {
      this.invoiceHelperService.regenerateInvoice(order);
    }

    if (dto.items) {
      this.generateKitchenReceipts(order, false);
    }
  }

  async setCustomer(order: OrderDocument) {
    const customer = await this.customerService.findByPhoneNumber(
      order.contactNumber,
      order.supplierId,
    );
    if (customer) {
      order.customerId = customer._id;
      order.save();
    }
  }

  async manageInventory(order: OrderDocument) {
    const items = order.items;
    const bundleMenuItemIds = order.bundles
      .map((b) => b.bundleSubGroups)
      .flat()
      .map((sg) => sg.items)
      .flat()
      .map((i) => i.menuItemId);
    let menuItemIds = items.map((oi) => oi.menuItem.menuItemId);
    menuItemIds.concat(bundleMenuItemIds);
    const menuItems = await this.menuItemModel.find({
      _id: { $in: menuItemIds },
      active: true,
      deletedAt: null,
    });
    for (const i in items) {
      const menuItem = menuItems.find((mi) => {
        return mi._id.toString() == items[i].menuItem.menuItemId.toString();
      });
      if (menuItem && menuItem.manageQuantity) {
        console.log('####### order', order);
        const index = menuItem.quantities.findIndex(
          (obj) =>
            obj.restaurantId.toString() == order.restaurantId._id.toString(),
        );
        console.log('$$$$$$$$Index', index);
        if (index >= 0) {
          menuItem.quantities[index].quantity -= items[i]?.quantity;
          if (menuItem.quantities[index]?.quantity == 0)
            menuItem.soldOut = true;
          menuItem.save();
        }
      }
      await this.inventoryHelperService.handlePostSale({
        restaurantId: order.restaurantId._id.toString(),
        menuItemId: menuItem._id.toString(),
        quantitiesSold: items[i].quantity,
        entity: order,
        price: items[i].unitPriceAfterDiscount,
        paymentStatus: order.paymentStatus,
        salesOrderType: order.orderType
      });
      // console.log("$$$ Items Addition check $$$$", items[i].additions)
      items[i].additions.forEach((a) => {

        a.options.forEach(async (ao) => {

          if (ao.unitPriceAfterDiscount > 0) {

            await this.inventoryHelperService.handlePostSale({
              restaurantId: order.restaurantId._id.toString(),
              menuItemId: menuItem._id.toString(),
              quantitiesSold: ao.quantity && ao.quantity > 0 ? ao.quantity : 1 * items[i].quantity,
              entity: order,
              price: ao.unitPriceAfterDiscount,
              paymentStatus: order.paymentStatus,
              menuAdditionId: a.menuAdditionId?.toString(),
              optionId: ao.optionId?.toString()
            });
          }

        });
      });
    }
    for (const i in order.bundles) {
      order.bundles.forEach((bi) => {
        const bundleMenuItemsDueForInventory = [];
        let totalWeightage = 0;
        bi.bundleSubGroups.forEach((bsg) => {
          bsg.items.forEach((item) => {
            const menuItem = menuItems.find((mi) => {
              return mi._id.toString() == item.menuItemId.toString();
            });
            if (menuItem && menuItem.manageQuantity) {
              console.log('####### order', order);
              const index = menuItem.quantities.findIndex(
                (obj) =>
                  obj.restaurantId.toString() ==
                  order.restaurantId._id.toString(),
              );
              console.log('$$$$$$$$Index', index);
              if (index >= 0) {
                menuItem.quantities[index].quantity -= item?.quantity;
                if (menuItem.quantities[index]?.quantity == 0)
                  menuItem.soldOut = true;
                menuItem.save();
              }
            }
            const weightage = menuItem.price / bi.amountAfterDiscount;
            totalWeightage += weightage;

            bundleMenuItemsDueForInventory.push({
              restaurantId: order.restaurantId._id.toString(),
              menuItemId: menuItem._id.toString(),
              quantitiesSold: item.quantity,
              entity: order,
              price: 0,
              paymentStatus: order.paymentStatus,
              weightage,
            });
          });
        });
        bundleMenuItemsDueForInventory.forEach(async (bundleMenuItem) => {
          await this.inventoryHelperService.handlePostSale({
            ...bundleMenuItem,
            price:
              (bundleMenuItem.weightage / totalWeightage) *
              bi.amountAfterDiscount,
          });
        });
      });
    }
  }

  async postCouponUsage(couponCode, amount) {
    await this.offerModel.findOneAndUpdate(
      { code: couponCode },
      { $inc: { totalUsed: 1, totalAmountUsed: amount } },
    );
  }

  async storeOrderStateActivity(
    order: OrderDocument,
    activityType: OrderActivityType,
    date,
  ) {
    const activityDetails: CreateActivityDto = {
      dataId: order._id,
      subject: ActivitySubject.Order,
      type: ActivityType.OrderState,
      data: { date, activityType },
    };

    await this.activityModel.create({
      ...activityDetails,
      supplierId: order.supplierId,
    });
  }

  async generateOrderNumber(supplierId: string, restaurantId: string, customDate: string = ""): Promise<string> {
    // let orderNumber = await this.cacheService.get(
    //   supplierId + '_lastOrderNumber',
    // );
    const monthLetters = {
      '01': 'A',
      '02': 'B',
      '03': 'C',
      '04': 'D',
      '05': 'E',
      '06': 'F',
      '07': 'G',
      '08': 'H',
      '09': 'I',
      '10': 'J',
      '11': 'K',
      '12': 'L',
    };
    let orderNumber = null;

    let today = moment().tz(TIMEZONE); // Get today's date



    if (customDate && customDate != "") {
      today = moment(new Date(customDate)).tz(TIMEZONE);

      console.log("today", today);
      try {
        let startDate = new Date(customDate);
        startDate.setUTCHours(0);
        startDate.setUTCMinutes(0);

        let endDate = new Date(customDate);
        endDate.setUTCHours(23);
        endDate.setUTCMinutes(59);


        const latestOrder = await this.orderModel.findOne(
          {
            supplierId: new mongoose.Types.ObjectId(supplierId),
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            createdAt: {
              $gte: startDate,
              $lte: endDate
            },
          
          },
          {},
          { sort: { orderNumber: -1 } } // Sort by createdAt to get the latest order
        );

        // If a latest order exists and its createdAt date is today, assign its orderNumber to orderNumber variable
        if (latestOrder && this.isSameDay(today.toDate(), new Date(latestOrder.createdAt?.toString()))) {
          orderNumber = latestOrder.orderNumber;
        }
      } catch (error) {
        console.error('Error finding the latest order:', error);
        // Handle error appropriately
      }
    }
    else if (!orderNumber) {
      
      try {
        // Find the latest order for the given supplierId and restaurantId
        let startDate = new Date(today?.toString());
        startDate.setUTCHours(0);
        startDate.setUTCMinutes(0);

        let endDate = new Date(today?.toString());
        endDate.setUTCHours(23);
        endDate.setUTCMinutes(59);

        const latestOrder = await this.orderModel.findOne(
          {
            supplierId: new mongoose.Types.ObjectId(supplierId),
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            createdAt: {
              $gte: startDate,
              $lte: endDate
            },
          },
          {},
          { sort: { orderNumber: -1 } } // Sort by createdAt to get the latest order
        );
        //console.log("I am in else", latestOrder);
        // If a latest order exists and its createdAt date is today, assign its orderNumber to orderNumber variable
        if (latestOrder && this.isSameDay(today.toDate(), new Date(latestOrder.createdAt?.toString()))) {
          orderNumber = latestOrder.orderNumber;
        }
      } catch (error) {
        console.error('Error finding the latest order:', error);
        // Handle error appropriately
      }
    }

    let n = 1;
    let formattedOrderNumber = '';
    // If orderNumber is not null, extract the sequence number
    if (orderNumber) {
      const sequence = orderNumber.includes('-') ? parseInt(orderNumber.split('-')[1]) + 1 : parseInt(orderNumber) + 1;
      n = sequence;
    }
    // Generate the formatted order number (YYMDD-Sequence)
    const year = today.format('YY');
    const month = monthLetters[today.format('MM')];
    const day = today.format('DD');

    const sequence = n.toString().padStart(3, '0');
    formattedOrderNumber = `${year}${month}${day}-${sequence}`;

    return formattedOrderNumber.toString();
  }

  /**
   * Function to check if two dates are the same day (ignoring time).
   * @param date1 The first date
   * @param date2 The second date
   * @returns True if the dates are the same day, false otherwise
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  async storeCart(orderData) {
    const cartItems = [];
    orderData.items.forEach((oi) => {
      const additions = [];
      oi.additions.forEach((oia) => {
        additions.push({
          menuAdditionId: oia.menuAdditionId,
          options: oia.options.map((o) => o.optionId),
        });
      });
      cartItems.push({
        menuItemId: oi.menuItem.menuItemId,
        additions,
      });
    });
    await this.cartModel.create({
      cartItems,
    });
  }

  async postKitchenQueueProcessing(
    order: OrderDocument,
    dto: KitchenQueueProcessDto,
  ) {
    if (dto.preparationStatus == PreparationStatus.DonePreparing) {
      const dataToNotify = {
        type: 'Item',
        data: null,
      };
      const modifiedOrder = await this.orderModel.findById(order._id);
      if (
        modifiedOrder.items.length ==
        modifiedOrder.items.filter((oi) => {
          return oi.preparationStatus == dto.preparationStatus;
        }).length
      ) {
        modifiedOrder.status = OrderStatus.DonePreparing;
        //modifiedOrder.preparationDetails.actualEndTime = new Date();
        const orderBeforeModified = modifiedOrder;
        await modifiedOrder.save();
        this.postOrderUpdate(
          order,
          { status: OrderStatus.DonePreparing },
          orderBeforeModified,
        );
        // this.calculationService.identifyOrdersToRecalculateAfterCompleted(
        //   modifiedOrder,
        // );
        dataToNotify.data = modifiedOrder.toObject();
        dataToNotify.type = 'Order';
      } else {
        dataToNotify.data = order.items.find(
          (oi) => oi._id.toString() == dto.orderItemId,
        );
      }
      // update table log
      if (order.tableId) {
        this.tableHelperService.handleReadyFlag(order);
      }
      // // notify customer
      // this.orderNotificationService.triggerOrderNotification(
      //   OrderEvents.DonePreparing,
      //   order,
      // );
      //console.log(`Socket Event ${}`);
      this.socketGateway.emit(
        order.supplierId.toString(),
        SocketEvents.OrderPrepared,
        dataToNotify,
      );
    }
  }
  async generateKitchenReceipts(order: OrderDocument, print = true) {
    const printersDetails: any = await this.orderService.identifyPrinters(
      { user: { supplierId: order.supplierId } },
      {
        orderId: order._id.toString(),
        printerType: PrinterType.Kitchen,
      },
      order,
      true,
    );

    if (printersDetails.printers.length > 0) {
      order.kitchenReceipts =
        await this.invoiceHelperService.generateKitchenReceipt(
          order,
          printersDetails,
          print,
        );
      order.save();
      //console.log(order);
    }
    else {
      // emit the socket of no active printer found

      this.socketGateway.emit(
        order.supplierId.toString(),
        SocketEvents.NoKitchenPrinterFound,
        "No kitchen printer found",
      );
    }
  }
  async notifyKitchenQueue(order: OrderDocument) {
    let kitchenQueues = order.items.map((oi) => oi.kitchenQueueId);
    for (const i in kitchenQueues) {
      if (kitchenQueues[i]) {
        this.socketGateway.emit(
          order.supplierId.toString(),
          SocketEvents.KitchenQueue,
          { KitchenQueueId: kitchenQueues[i], orderListRefresh: true },
        );
      }
    }
  }

  calculateShishaFees(itemTaxableAmount: number, qty: number, taxRate: number, isShisha: boolean) {
    let tax = 0, totalFee = 0, subTotal = 0;
    tax = itemTaxableAmount * ((taxRate / 100) / (1 + taxRate / 100));
    itemTaxableAmount = itemTaxableAmount - tax;
    if (isShisha) {
      totalFee = Math.max((itemTaxableAmount / qty) / 2, 25);
      totalFee = totalFee * qty;
    }
    subTotal = itemTaxableAmount - totalFee;

    return {
      tax,
      itemTaxableAmount,
      totalFee,
      subTotal
    }
  }

}
