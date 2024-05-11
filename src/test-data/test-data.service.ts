import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CashierService } from 'src/cashier/cashier.service';
import { CreateCashierDto } from 'src/cashier/dto/create-cashier.dto';
import { CashierDocument } from 'src/cashier/schemas/cashier.schema';
import { ListType, RoleSlug } from 'src/core/Constants/enum';
import { generateRandomPassword } from 'src/core/Helpers/universal.helper';
import { CreateInvoiceDto } from 'src/invoice/dto/create-invoice.dto';
import { InvoiceType } from 'src/invoice/invoice.enum';
import { InvoiceService } from 'src/invoice/invoice.service';
import { CreateKitchenQueueDto } from 'src/kitchen-queue/dto/create-kitchen-queue.dto';
import { KitchenQueueService } from 'src/kitchen-queue/kitchen-queue.service';
import { KitchenQueueDocument } from 'src/kitchen-queue/schemas/kitchen-queue.schema';
import { CreateListDto } from 'src/list/dto/create-list.dto';
import { ListService } from 'src/list/list.service';
import { CreateMenuCategoryDTO } from 'src/menu/dto/menu-category.dto';
import { CreateMenuItemDTO } from 'src/menu/dto/menu-item.dto';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { MenuCategoryService } from 'src/menu/service/menu-category.service';
import { MenuItemService } from 'src/menu/service/menu-item.service';
import { MailService } from 'src/notification/mail/mail.service';
import { CreateOrderDto } from 'src/order/dto/create-order.dto';
import { OrderType, Source } from 'src/order/enum/en.enum';
import { OrderService } from 'src/order/order.service';
import { OrderDocument } from 'src/order/schemas/order.schema';
import { CreatePaymentSetupDto } from 'src/payment-setup/dto/create-payment-setup.dto';
import { PaymentSetupService } from 'src/payment-setup/payment-setup.service';
import { PaymentInitiateDto } from 'src/payment/dto/payment.dto';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { PaymentService } from 'src/payment/payment.service';
import { CreateRestaurantDto } from 'src/restaurant/dto/create-restaurant.dto';
import { RestaurantService } from 'src/restaurant/restaurant.service';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { Role, RoleDocument } from 'src/role/schemas/roles.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { CreateTableDto } from 'src/table/dto/create-table.dto';
import { TableDocument } from 'src/table/schemas/table.schema';
import { TableService } from 'src/table/table.service';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { UserCreateDto } from 'src/users/dto/users.dto';
import { UserService } from 'src/users/users.service';
import { CreateRestaurantData } from './data/create-restaurant-data.dto';
import { storageAreaData, tableData, tableRegionData, wasteRegionData } from './data/table-data';
import { kitchenQueueData } from './data/kitchen-queue-data';
import { CashierData } from './data/cashier-data';
import { PaymentSetupData } from './data/payment-setup-data';
import { MenuCategoryData, MenuItemData } from './data/menu-data';
import { CreateOfferDto } from 'src/offer/dto/create-offer.dto';
import { OfferData } from './data/offer-data';
import { OfferService } from 'src/offer/offer.service';
import { CreateGlVendorCodeDto } from 'src/gl-vendor-code/dto/create-gl-vendor-code.dto';
import { GlVendorCodeService } from 'src/gl-vendor-code/gl-vendor-code.service';
import { CreateGlMaterialCodeDto } from 'src/gl-material-code/dto/create-gl-material-code.dto';
import { GlMaterialCodeService } from 'src/gl-material-code/gl-material-code.service';
import { PurchaseCategoryService } from 'src/purchase-category/purchase-category.service';
import { CreatePurchaseCategoryDto } from 'src/purchase-category/dto/create-purchase-category.dto';
import { PermissionDto, RoleCreateDto } from 'src/role/role.dto';
import { SocketEvents } from 'src/socket-io/enum/events.enum';
import { PaymentPermission, PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { PermissionActions } from 'src/core/Constants/permission.type';
import { RoleService } from 'src/role/role.service';
import { GlAccountGroupService } from 'src/gl-account-group/gl-account-group.service';
import { GlAccountSetService } from 'src/gl-account-set/gl-account-set.service';
import { GlAccountService } from 'src/gl-account/gl-account.service';
import { CreateGlAccountGroupDto } from 'src/gl-account-group/dto/create-gl-account-group.dto';
import { CreateGlAccountSetDto } from 'src/gl-account-set/dto/create-gl-account-set.dto';
import { CreateGlAccountDto } from 'src/gl-account/dto/create-gl-account.dto';
import { ChartOfAccountService } from 'src/chart-of-account/chart-of-account.service';
import { CreateChartOfAccountDto } from 'src/chart-of-account/dto/create-chart-of-account.dto';
import { CreateGlAccountMappingDto } from 'src/gl-account-mapping/dto/create-gl-account-mapping.dto';
import { GlAccountMappingService } from 'src/gl-account-mapping/gl-account-mapping.service';
import { VendorService } from 'src/vendor/vendor.service';
import { CreateVendorDto } from 'src/vendor/dto/create-vendor.dto';
import { GlRevenueCodeService } from 'src/gl-revenue-code/gl-revenue-code.service';
import { CreateGlRevenueCodeDto } from 'src/gl-revenue-code/dto/create-gl-revenue-code.dto';
import { CreatePrimeCostTemplateDto } from 'src/prime-cost-cal/dto/create-prime-cost-template.dto';
import { PrimeCostService } from 'src/prime-cost-cal/prime-cost.service';
import { GlAssetCodeService } from 'src/gl-asset-code/gl-asset-code.service';
import configureMeasurements, {
  AllMeasures,
  AllMeasuresSystems,
  AllMeasuresUnits,
  allMeasures,
} from 'convert-units';
import { UnitOfMeasureService } from 'src/unit-of-measure/unit-of-measure.service';
import { ProfitLossService } from 'src/profit-loss-cal/profit-loss.service';
import { BalanceSheetService } from 'src/balance-sheet-cal/balance-sheet.service';

@Injectable()
export class TestDataService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly tableService: TableService,
    private readonly listService: ListService,
    private readonly cashierService: CashierService,
    private readonly kitchenQueueService: KitchenQueueService,
    private readonly menuCategoryService: MenuCategoryService,
    private readonly menuItemService: MenuItemService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly paymentSetupService: PaymentSetupService,
    private readonly invoiceService: InvoiceService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly offerService: OfferService,
    private readonly glvendorCodeService: GlVendorCodeService,
    private readonly glMatService: GlMaterialCodeService,
    private readonly poCatservice: PurchaseCategoryService,
    private readonly roleservice: RoleService,
    private readonly glAccGroupService: GlAccountGroupService,
    private readonly glAccSetService: GlAccountSetService,
    private readonly glAccService: GlAccountService,
    private readonly coaService: ChartOfAccountService,
    private readonly glaccMapService: GlAccountMappingService,
    private readonly vendorService: VendorService,
    private readonly glRevenueCodeService: GlRevenueCodeService,
    private readonly glAssetCodeService: GlAssetCodeService,
    private readonly primeCostService: PrimeCostService,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly profitLossService: ProfitLossService,
    private readonly balanceSheetService: BalanceSheetService,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }
  async run(req: any, supplier: SupplierDocument) {
    if (!req) {
      req = {
        user: {
          supplierId: supplier._id,
        },
      };
    } else req.user.supplierId = supplier._id;

    this.paymentSetup(req);

    let user: UserDocument = await this.userModel.findOne({
      supplierId: supplier._id,
    });
    if (!user) user = await this.createSupplierAdmin(req, supplier);

    const offer = await this.createOffer(req, supplier);

    const restaurant = await this.createRestaurant(req, supplier);
    await this.adddefaultUoMsData(req);

    const table = await this.createTable(req, restaurant);

    const cashier = await this.createCashier(req, restaurant, user);

    const kitchenQueue = await this.createKitchenQueue(req, restaurant, user);

    const menuItem = await this.createMenu(req);

    const glVendor = await this.createGLVendorCode(req);
    const glmatCode = await this.createGLMatCode(req);
    const pocatgory = await this.createPOCategory(req);
    const glRevCode = await this.createGLRevenueCode(req);
    const glAssetCode = await this.createGLAssetCode(req);

    await this.createAllRoles(req, supplier);
    await this.createAllList(req);

    await this.createGLGroupAndAccount(req, supplier, glVendor._id, pocatgory._id, glmatCode._id, glRevCode._id, glAssetCode._id);

    await this.createDefaultPrimeCostTemplate(req);
    await this.createDefaultProfitLossTemplate(req);
    await this.createDefaultBalanceSheetTemplate(req);

    const order = await this.createOrder(
      req,
      restaurant,
      table,
      kitchenQueue,
      menuItem,
    );
    await this.takePayment(req, order, cashier);

    const invoice = await this.createInvioice(req, order);

    return true;
  }

  async createRestaurant(req, supplier: SupplierDocument) {
    const dto: CreateRestaurantDto = {
      name: supplier.name,
      nameAr: supplier.nameAr,
      defaultWorkingHours: supplier.defaultWorkingHours,
      overrideWorkingHours: supplier.overrideWorkingHours,
      ...CreateRestaurantData,
      isMainBranch: true,
      quickCashierImage:true
    };
    const restaurant = await this.restaurantService.create(req, dto, false);
    return restaurant;
  }
  async adddefaultUoMsData(req: any) {
    await this.unitOfMeasureService.adddefaultUoMs(req)
  }

  async createOffer(req, supplier: SupplierDocument) {
    const dto: CreateOfferDto = {
      ...OfferData,
    };
    const offer = await this.offerService.create(req, dto);
    return offer;
  }

  async createSupplierAdmin(req, supplier: SupplierDocument) {
    const adminRole = await this.roleModel.findOne({
      slug: RoleSlug.SupplierAdmin,
    });
    const password = generateRandomPassword();
    const dto = {
      name: 'Supplier Admin',
      email: supplier.email,
      password,
      role: adminRole ? adminRole._id : null,
    };
    console.log(dto);
    const user = await this.userService.create(req, dto);
    if (user) {
      this.mailService.send({
        to: supplier.email,
        subject: 'Account Setup',
        body: `Your account is setup following are the crednetials to access your account:
        Username: <b>${user.email}</b> 
        Password: <b>${password}</b>
        Alias: <b>${supplier.alias}</b>`,
      });
    }
    return user;
  }

  async paymentSetup(req) {
    await this.paymentSetupService.create(req, PaymentSetupData);
  }

  async createTable(req, restaurant: RestaurantDocument) {
    const tableRegionDto: CreateListDto = {
      ...tableRegionData,
    };
    const tableRegion = await this.listService.create(req, tableRegionDto);
    const dto: CreateTableDto = {
      ...tableData,
      restaurantId: restaurant._id,
      tableRegionId: tableRegion._id,
    };

    const table = await this.tableService.create(req, dto);
    return table;
  }

  async createCashier(req, restaurant: RestaurantDocument, user: UserDocument) {
    const dto: CreateCashierDto = {
      ...CashierData,
      restaurantId: restaurant._id,
    };
    const cashier = await this.cashierService.create(req, dto);
    this.userService.update(user._id.toString(), { cashier: cashier._id });
    return cashier;
  }

  async createKitchenQueue(
    req,
    restaurant: RestaurantDocument,
    user: UserDocument,
  ) {
    const dto: CreateKitchenQueueDto = {
      ...kitchenQueueData,
      restaurantId: restaurant._id,
    };
    const kitchenQueue = await this.kitchenQueueService.create(req, dto);
    this.userService.update(user._id.toString(), {
      kitchenQueue: kitchenQueue._id,
    });
    return kitchenQueue;
  }

  async createMenu(req) {
    const menuCategory = await this.menuCategoryService.create(
      req,
      MenuCategoryData,
    );

    const menuItemDto: CreateMenuItemDTO = {
      ...MenuItemData,
      categoryId: menuCategory._id,
    };

    const menuItem = await this.menuItemService.create(req, menuItemDto);
    return menuItem;
  }

  async createOrder(
    req,
    restaurant: RestaurantDocument,
    table: TableDocument,
    kitchenQueue: KitchenQueueDocument,
    menuItem: MenuItemDocument,
  ) {
    const dto: CreateOrderDto = {
      restaurantId: restaurant._id,
      tableId: table._id,
      kitchenQueueId: kitchenQueue._id,
      source: Source.DineIn,
      name: 'Customer 1',
      contactNumber: '1234567890',
      orderType: OrderType.DineIn,
      items: [
        {
          menuItem: {
            menuItemId: menuItem._id,
          },
          quantity: 5,
          notes: 'Make it spicy',
        },
      ],
    };
    const order = await this.orderService.create(req, dto);
    return order;
  }

  async takePayment(req, order: OrderDocument, cashier: CashierDocument) {
    const dto: PaymentInitiateDto = {
      orderId: order._id,
      paymentMethod: PaymentMethod.Cash,
      cashierId: cashier._id,
    };
    await this.paymentService.create(req, dto);
  }

  async createInvioice(req, order: OrderDocument) {
    const dto: CreateInvoiceDto = {
      orderId: order._id,
      type: InvoiceType.Invoice,
    };
    const invoice = await this.invoiceService.create(req, dto);
    return invoice;
  }

  async createGLVendorCode(req) {
    const dto: CreateGlVendorCodeDto = {
      name: "Standard Vendor",
      nameAr: "ن القياسي"
    }
    const res = await this.glvendorCodeService.create(req, dto);

    const dtoVendor: CreateVendorDto = {
      name: "Default Vendor",
      nameAr: "البائع الافتراضي",
      address: "",
      contactPerson: "",
      email: "",
      glVendorCodeId: res?._id,
      externalVendorId: null,
      phoneNumber: "",
      vatNumber: ""
    }
    await this.vendorService.create(req, dtoVendor);
    return res;
  }
  async createGLMatCode(req) {
    const dto: CreateGlMaterialCodeDto = {
      name: "Standard Inventory",
      nameAr: "المخزون القياسي"
    }
    return await this.glMatService.create(req, dto);
  }
  async createPOCategory(req) {
    const dto: CreatePurchaseCategoryDto = {
      name: "Gerneral Purchases",
      nameAr: "المشتريات العامة"
    }
    return await this.poCatservice.create(req, dto);
  }

  async createGLRevenueCode(req) {
    const dto: CreateGlRevenueCodeDto = {
      name: "Revenue1",
      nameAr: "Revenue1"
    }
    return await this.glRevenueCodeService.create(req, dto);
  }

  async createGLAssetCode(req) {
    const dto: CreateGlRevenueCodeDto = {
      name: "Asset1",
      nameAr: "Asset1"
    }
    return await this.glAssetCodeService.create(req, dto);
  }

  async createAllList(req) {
    await this.listService.create(req, storageAreaData);
    await this.listService.create(req, wasteRegionData);
  }

  async createAllRoles(req, supplier: SupplierDocument) {


    //Fake Cashier
    const permissionDTOFakeCashier: PermissionDto[] = [
      {
        "subject": PermissionSubject.Role,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Transaction,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.User,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.EmailTemplate,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.CustomFields,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Restaurant,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Table,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.TableLog,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.MenuCategory,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.MenuAddition,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.MenuItem,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.KitchenQueue,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.QrCode,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Cashier,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.ClientComment,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.ClientFeedback,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.List,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.WaitingQueue,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Reservation,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Business,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Offer,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.NotificationConfig,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Invoice,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Customer,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Import,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlobalConfig,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Report,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Delivery,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Material,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Printer,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Driver,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Expense,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Purchase,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlAccount,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlAccountGroup,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlMaterialCode,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlVendorCode,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlVoucher,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Campaign,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.PurchaseCategory,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlAccountMapping,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.AccountingReportTemplate,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.GlAccountSet,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.ManualVendorPayment,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.ManualVendorInvoice,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.ManualCustomerInvoice,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.ManualCustomerPayment,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Batch,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.Bundle,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
      {
        "subject": PermissionSubject.EmpDebt,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
        ]
      },
    ];


    const dtoFakeCashier: RoleCreateDto = {
      events: [
        SocketEvents.CashierDashboard,
        SocketEvents.Cashier,
        SocketEvents.Invoice,
        SocketEvents.print,
        SocketEvents.TableLog,
        SocketEvents.TableDashboard,
        SocketEvents.KitchenQueue,
        SocketEvents.KitchenQueueDashboard,
        SocketEvents.ping,
        SocketEvents.auth,
        SocketEvents.OrderCreated,
        SocketEvents.OrderPrepared,
        SocketEvents.PosLaunched,
        SocketEvents.PosTransaction,
        SocketEvents.NoKitchenPrinterFound,
        SocketEvents.NoCashierPrinterFound
      ],
      name: "FakeCashier",
      supplierId: supplier._id,
      screenDisplays: [
        "651cfff246c9c85c379f7b2c",
        "63fdcd65da60c5c86e9da1ab"
      ],
      permissions: permissionDTOFakeCashier,
      slug: RoleSlug.Cashier
    }

    await this.roleservice.create(req, dtoFakeCashier);



    // cashier
    const permissionDTOCashier: PermissionDto[] =
      [
        {
          "subject": PermissionSubject.Role,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.Transaction,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.User,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.EmailTemplate,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.CustomFields,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.Restaurant,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.Table,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.TableLog,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.MenuCategory,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.MenuAddition,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.MenuItem,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.KitchenQueue,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.QrCode,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.Cashier,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.ClientFeedback,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.List,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.Activity,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.WaitingQueue,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.Reservation,
          "permissions": [
            PermissionActions.FETCH,
            PermissionActions.LIST
          ]
        },
        {
          "subject": PermissionSubject.Order,
          "permissions": [
            PermissionActions.MANAGE,
            PermissionActions.LIST,
            PermissionActions.FETCH,
            PermissionActions.CREATE,
            PermissionActions.UPDATE,
            PermissionActions.DELETE,
            PermissionActions.START,
            PermissionActions.CLOSE,
            PermissionActions.PAUSE,
            PermissionActions.RESUME,
            PermissionActions.CANCEL,
            PermissionActions.MANAGE,
            PermissionActions.CancelOrder,
            PermissionActions.SentToKitchen,
            PermissionActions.Reset,
            PermissionActions.OnTable,
            PermissionActions.Change,
            PermissionActions.ChangeTable,
            PermissionActions.Defer,
            PermissionActions.KitchenDisplay,
            PermissionActions.ChefInquiry,
            PermissionActions.KitchenQueueProcess,
            PermissionActions.LimitedOrderCancel,
            PermissionActions.LimitedOrderUpdate,
            PermissionActions.ApplyDiscount,
            PermissionActions.SetDriver,
            PermissionActions.ChangeDeliveryStatus,
            PermissionActions.ProcessMarketPlace,
            PermissionActions.DynamicPricePreview
          ]
        },
        {
          "subject": PermissionSubject.Business,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Offer,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.NotificationConfig,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Customer,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.Import,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlobalConfig,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Report,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Delivery,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Vendor,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Material,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.PurchaseOrder,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GoodsReceipt,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.UnitOfMeasure,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Inventory,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Recipe,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.ProductionEvent,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.WasteEvent,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.InventoryCount,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.ProfitDetails,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.InvoiceReceipt,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.SelectedVendor,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.VendorMaterial,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.SmsProvider,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.CustomerCondition,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Printer,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.Payment,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.Driver,
          "permissions": [
            PermissionActions.MANAGE
          ]
        },
        {
          "subject": PermissionSubject.Expense,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Purchase,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlAccount,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlAccountGroup,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlMaterialCode,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlVendorCode,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlVoucher,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Campaign,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.PurchaseCategory,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlAccountMapping,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.AccountingReportTemplate,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.GlAccountSet,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.ManualCustomerInvoice,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.ManualCustomerPayment,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.ManualVendorInvoice,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.ManualVendorPayment,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Batch,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.Bundle,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        },
        {
          "subject": PermissionSubject.EmpDebt,
          "permissions": [
            PermissionActions.LIST,
            PermissionActions.FETCH
          ]
        }
      ]

    const dtoCashier: RoleCreateDto = {
      events: [
        SocketEvents.CashierDashboard,
        SocketEvents.Cashier,
        SocketEvents.Invoice,
        SocketEvents.print,
        SocketEvents.TableLog,
        SocketEvents.TableDashboard,
        SocketEvents.KitchenQueue,
        SocketEvents.KitchenQueueDashboard,
        SocketEvents.ping,
        SocketEvents.auth,
        SocketEvents.OrderCreated,
        SocketEvents.OrderPrepared,
        SocketEvents.PosLaunched,
        SocketEvents.PosTransaction,
        SocketEvents.NoKitchenPrinterFound,
        SocketEvents.NoCashierPrinterFound
      ],
      name: "Cashier",
      supplierId: supplier._id,
      screenDisplays: [
        "64a6b2a909d89674c1c2bb10",
        "64a6b29409d89674c1c2bb09",
        "64a6b29f09d89674c1c2bb0d"
      ],
      permissions: permissionDTOCashier,
      slug: RoleSlug.Cashier
    }

    await this.roleservice.create(req, dtoCashier);

    // WAITER

    const permissionDTOWaiter: PermissionDto[] = [
      {
        "subject": PermissionSubject.Role,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.Transaction,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.User,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.EmailTemplate,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.CustomFields,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Restaurant,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.Table,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.TableLog,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.MenuCategory,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.MenuAddition,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.MenuItem,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.KitchenQueue,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.QrCode,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.Cashier,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ClientComment,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.ClientFeedback,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.List,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Activity,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.WaitingQueue,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Reservation,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Order,
        "permissions": [
          PermissionActions.MANAGE,
          PermissionActions.LIST,
          PermissionActions.FETCH,
          PermissionActions.CREATE,
          PermissionActions.UPDATE,
          PermissionActions.DELETE,
          PermissionActions.START,
          PermissionActions.CLOSE,
          PermissionActions.PAUSE,
          PermissionActions.RESUME,
          PermissionActions.CANCEL,
          PermissionActions.MANAGE,
          PermissionActions.CancelOrder,
          PermissionActions.SentToKitchen,
          PermissionActions.Reset,
          PermissionActions.OnTable,
          PermissionActions.Change,
          PermissionActions.ChangeTable,
          PermissionActions.Defer,
          PermissionActions.KitchenDisplay,
          PermissionActions.ChefInquiry,
          PermissionActions.KitchenQueueProcess,
          PermissionActions.LimitedOrderCancel,
          PermissionActions.LimitedOrderUpdate,
          PermissionActions.ApplyDiscount,
          PermissionActions.SetDriver,
          PermissionActions.ChangeDeliveryStatus,
          PermissionActions.ProcessMarketPlace,
          PermissionActions.DynamicPricePreview
        ]
      },
      {
        "subject": PermissionSubject.Business,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Offer,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.NotificationConfig,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Invoice,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Customer,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Import,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlobalConfig,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Report,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Delivery,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Vendor,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Material,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.PurchaseOrder,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GoodsReceipt,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.UnitOfMeasure,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Inventory,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Recipe,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.ProductionEvent,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.WasteEvent,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.InventoryCount,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.ProfitDetails,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.InvoiceReceipt,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.SelectedVendor,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.VendorMaterial,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.SmsProvider,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.CustomerCondition,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Printer,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Payment,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Driver,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Expense,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Purchase,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlAccount,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlAccountGroup,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlMaterialCode,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlVendorCode,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlVoucher,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Campaign,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.PurchaseCategory,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlAccountMapping,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.AccountingReportTemplate,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.GlAccountSet,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.ManualCustomerInvoice,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.ManualCustomerPayment,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.ManualVendorInvoice,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.ManualVendorPayment,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Batch,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Bundle,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.EmpDebt,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
    ]

    const dtoWaiter: RoleCreateDto = {
      events: [
        SocketEvents.CashierDashboard,
        SocketEvents.Cashier,
        SocketEvents.Invoice,
        SocketEvents.print,
        SocketEvents.TableLog,
        SocketEvents.TableDashboard,
        SocketEvents.KitchenQueue,
        SocketEvents.KitchenQueueDashboard,
        SocketEvents.ping,
        SocketEvents.auth,
        SocketEvents.OrderCreated,
        SocketEvents.OrderPrepared,
        SocketEvents.PosLaunched,
        SocketEvents.PosTransaction,
        SocketEvents.NoKitchenPrinterFound,
        SocketEvents.NoCashierPrinterFound  
      ],
      name: "Waiter",
      supplierId: supplier._id,
      screenDisplays: [
        "659ec7775e8b5070d436bfb3",
        "64a6b2a909d89674c1c2bb10",
        "64a6b29f09d89674c1c2bb0d"
      ],
      permissions: permissionDTOWaiter,
      slug: RoleSlug.Waiter
    }

    await this.roleservice.create(req, dtoWaiter);


    //Manager
    const permissionDTOManager: PermissionDto[] = [
      {
        "subject": PermissionSubject.Role,
        "permissions": [
          PermissionActions.FETCH,
          PermissionActions.LIST
        ]
      },
      {
        "subject": PermissionSubject.User,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.EmailTemplate,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.CustomFields,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Restaurant,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Table,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.TableLog,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.MenuCategory,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.MenuAddition,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.MenuItem,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.KitchenQueue,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.QrCode,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Cashier,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ClientComment,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.List,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Activity,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Order,
        "permissions": [
          PermissionActions.MANAGE,
          PermissionActions.LIST,
          PermissionActions.FETCH,
          PermissionActions.CREATE,
          PermissionActions.UPDATE,
          PermissionActions.DELETE,
          PermissionActions.START,
          PermissionActions.CLOSE,
          PermissionActions.PAUSE,
          PermissionActions.RESUME,
          PermissionActions.CANCEL,
          PermissionActions.MANAGE,
          PermissionActions.CancelOrder,
          PermissionActions.SentToKitchen,
          PermissionActions.Reset,
          PermissionActions.OnTable,
          PermissionActions.Change,
          PermissionActions.ChangeTable,
          PermissionActions.Defer,
          PermissionActions.KitchenDisplay,
          PermissionActions.ChefInquiry,
          PermissionActions.KitchenQueueProcess,
          PermissionActions.LimitedOrderCancel,
          PermissionActions.LimitedOrderUpdate,
          PermissionActions.ApplyDiscount,
          PermissionActions.SetDriver,
          PermissionActions.ChangeDeliveryStatus,
          PermissionActions.ProcessMarketPlace,
          PermissionActions.DynamicPricePreview
        ]
      },
      {
        "subject": PermissionSubject.Business,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Offer,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH
        ]
      },
      {
        "subject": PermissionSubject.Invoice,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Customer,
        "permissions": [
          PermissionActions.LIST,
          PermissionActions.FETCH,
          PermissionActions.CREATE,
          PermissionActions.UPDATE,
          PermissionActions.START,
          PermissionActions.CLOSE,
          PermissionActions.RESUME,
          PermissionActions.CANCEL,
          PermissionActions.PAUSE,
          PermissionActions.CustomerProfileFetch,
          PermissionActions.CustomerProfileUpdate
        ]
      },
      {
        "subject": PermissionSubject.Import,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Report,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Delivery,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Vendor,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Material,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.PurchaseOrder,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GoodsReceipt,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.UnitOfMeasure,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Inventory,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Recipe,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ProductionEvent,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.WasteEvent,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.InventoryCount,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ProfitDetails,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.InvoiceReceipt,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.SelectedVendor,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.VendorMaterial,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.SmsProvider,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.CustomerCondition,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Printer,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Payment,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Driver,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Expense,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Purchase,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlAccount,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlAccountGroup,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlMaterialCode,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlVendorCode,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlAccountMapping,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlAccountSet,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.GlVoucher,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Campaign,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.PurchaseCategory,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.AccountingReportTemplate,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ManualVendorInvoice,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ManualVendorPayment,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ManualCustomerInvoice,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.ManualCustomerPayment,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Batch,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.Bundle,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
      {
        "subject": PermissionSubject.EmpDebt,
        "permissions": [
          PermissionActions.MANAGE
        ]
      },
    ]

    const dtoManager: RoleCreateDto = {
      events: [
        SocketEvents.CashierDashboard,
        SocketEvents.Cashier,
        SocketEvents.Invoice,
        SocketEvents.print,
        SocketEvents.TableLog,
        SocketEvents.TableDashboard],
      name: "Manager",
      supplierId: supplier._id,
      screenDisplays: [
        "659ec7775e8b5070d436bfb3",
        "653ffeb669f0dafbbef626a2",
        "651d073446c9c85c379f8264",
        "651cfff246c9c85c379f7b2c",
        "651cffe046c9c85c379f7b2a",
        "651cff5e46c9c85c379f7a77",
        "651cff5346c9c85c379f7a73",
        "651cff3646c9c85c379f7a69",
        "651cff1146c9c85c379f7a61",
        "64a6b2a909d89674c1c2bb10",
        "64a6b29f09d89674c1c2bb0d",
        "64a6b26f09d89674c1c2bb00",
        "64a6b26209d89674c1c2bafd",
        "64a6b25409d89674c1c2bafa",
        "64a6b17909d89674c1c2baaf",
        "63fdcd65da60c5c86e9da1ab",
        "6529055ba38d5ba477733077"
      ],
      permissions: permissionDTOManager,
      slug: RoleSlug.Waiter
    }

    await this.roleservice.create(req, dtoManager);
  }

  async createGLGroupAndAccount(req, supplier: SupplierDocument, vendorId, poCatId, matCodeId, revCodeId, assetCodeId) {

    const myExistingData = [
      {
        "name": "1101 - Cash & Cash Equivaelant",
        "nameAr": " 1101 - النقد ومايعادله",
        "children": [
          {
            "glNumber": "110101",
            "name": "Cash",
            "nameAr": "كاش",
          }
        ]
      },
      {
        "name": "1102 - Cash in Bank",
        "nameAr": "1102 - النقدية في البنك",
        "children": [
          {
            "glNumber": "110201",
            "name": "Alrajhi Bank",
            "nameAr": "بنك الراجحي",
          }
        ]
      },
      {
        "name": "1103 -  Receivables",
        "nameAr": "1103 - المدينون",
        "children": [
          {
            "glNumber": "110301",
            "name": "Account Receivable",
            "nameAr": "الذمم المدينة - العملاء",
          }
        ]
      },
      {
        "name": "1104 - Advanced Payments",
        "nameAr": "1104 - مصروفات مقدمة",
        "children": [
          {
            "glNumber": "110401",
            "name": "Employee Advance",
            "nameAr": "دفعات للموظفين مقدما",
          },
          {
            "glNumber": "110402",
            "name": "Other Prepayments",
            "nameAr": "دفعات أخرى مقدما",
          },
          {
            "glNumber": "110403",
            "name": "Office Insurance Payment Returned",
            "nameAr": "دفعة تأمين ايجار المكتب مستردة",
          }
        ]
      },
      {
        "name": "1105 - Advanced Employee Payment",
        "nameAr": "1105 - مدفوعات مقدمة للموظفين",
        "children": []
      },
      {
        "name": "1106 - Inventories",
        "nameAr": "1106 - المخزون",
        "children": [
          {
            "glNumber": "110601",
            "name": "All Inventory",
            "nameAr": "المخزون",
          }
        ]
      },
      {
        "name": "1107 - Suspense Accounts & Other Accounts",
        "nameAr": "1107 - حسابات وسيطة واخرى",
        "children": [
          {
            "glNumber": "110701",
            "name": "Price Change Offsetting Account",
            "nameAr": "حساب تغيير سعر المخزون",
          }
        ]
      },
      {
        "name": "1201 - Realestate & Equi",
        "nameAr": "1201 - عقارات وآلات ومعدات",
        "children": []
      },
      {
        "name": "1202 - Intangible Assets",
        "nameAr": "1202 - الأصول غير الملموسة",
        "children": []
      },
      {
        "name": "1203 - Investment Estate",
        "nameAr": "1203 - العقارات الاستثمارية",
        "children": []
      },
      {
        "name": "2101 - Account Payables",
        "nameAr": "2101 - الدائنون",
        "children": [
          {
            "glNumber": "210101",
            "name": "Accounts Payable (A/P)",
            "nameAr": "الذمم الدائنة",
          },
          {
            "glNumber": "210102",
            "name": "GRIR Suspense Account",
            "nameAr": "حساب الوسيط لاستلام البضاعه",
          }
        ]
      },
      {
        "name": "2102 - Accrued Expenses",
        "nameAr": "2102 - مصروفات مستحقة",
        "children": [
          {
            "glNumber": "210201",
            "name": "Accrued Expenses",
            "nameAr": "المصاريف المستحقة",
          }
        ]
      },
      {
        "name": "2103 - Accrued Salaries",
        "nameAr": "2103 - الرواتب المستحقة",
        "children": [
          {
            "glNumber": "210301",
            "name": "Accrued Salaries,Wages",
            "nameAr": "مصاريف مستحقة ( رواتب ، بدلات أخرى )",
          }
        ]
      },
      {
        "name": "2104 - Short-Term Loans",
        "nameAr": "2104 - قروض قصيرة الأجل",
        "children": []
      },
      {
        "name": "2105 - VAT Tax Payable",
        "nameAr": "2105 - ضريبة القيمة المضافة المستحقة",
        "children": [
          {
            "glNumber": "210501",
            "name": "Output VAT",
            "nameAr": "ضريبة القيمة المضافة - المبيعات",
          },
          {
            "glNumber": "210502",
            "name": "Input Tax (Vendor)",
            "nameAr": "ضريبة القيمة المضافة",
          },
          {
            "glNumber": "210503",
            "name": "Shisha Tax",
            "nameAr": "رسوم وضرائب التبغ",
          }
        ]
      },
      {
        "name": "2106 - Accrued Tax",
        "nameAr": "2106 - الضرائب المستحقة - الشركات الاجنبية",
        "children": []
      },

      {
        "name": "2107 -Unearned revenues",
        "nameAr": "2107 - إيرادات غير مكتسبة",
        "children": []
      },
      {
        "name": "2108 -  Social Security fees Payable",
        "nameAr": "2108 - مستحقات المؤسسة العامة للتأمينات الاجتماعية",
        "children": []
      },
      {
        "name": "2109 - Accumulated Depreciation",
        "nameAr": "2109 - مجمع الاستهلاك",
        "children": [
          {
            "name": "210901- Buildings accumulated depreciation",
            "nameAr": "210901- مجمع استهلاك المباني",
            "glNumber": "1",
          },
          {
            "name": "210902- Equipment accumulated depreciation",
            "nameAr": "210902 - مجمع استهلاك المعدات",
            "glNumber": "1",
          },
          {
            "name": "210903 - Computers & printers accumulated depreciation",
            "nameAr": "210903 - مجمع استهلاك أجهزة مكتبية وطابعات",
            "glNumber": "1",
          }
        ]
      },
      {
        "name": "2201 - Long Term Loans",
        "nameAr": "2201 - قروض طويلة أجل",
        "children": []
      },
      {
        "name": "2202 - End of Services Provision",
        "nameAr": "2202 - مخصص مكافأة نهاية الخدمة",
        "children": []
      },
      {
        "name": "3101 - Registered Capital",
        "nameAr": "3101 - رأس المال المسجل",
        "children": []
      },
      {
        "name": "3102 - Additional Paid Capital",
        "nameAr": "3102 - رأس المال الإضافي المدفوع",
        "children": []
      },
      {
        "name": "3201 - Opening Balance",
        "nameAr": "3201 - أرصدة افتتاحية",
        "children": []
      },
      {
        "name": "3301 - Statutory Reserve",
        "nameAr": "3301 - احتياطي نظامي",
        "children": []
      },
      {
        "name": "3302 - Foreign Currency Translation Reserve",
        "nameAr": "3302 - احتياطي ترجمة عملات أجنبية",
        "children": []
      },
      {
        "name": "3401 - Profit & Loss",
        "nameAr": "3401 - الأرباح والخسائر العاملة",
        "children": []
      },

      {
        "name": "3402 - Retained Earnings or Loss",
        "nameAr": "3402 - الأرباح المبقاة (أو الخسائر)",
        "children": []
      },
      {
        "name": "4101 - Revenue of Products and Services Sales",
        "nameAr": "4101 - إيرادات المبيعات/ الخدمات",
        "children": [
          {
            "glNumber": "410101",
            "name": "Revenue",
            "nameAr": "ايرادات المبيعات",
          }
        ]
      },
      {
        "name": "4201 - Other Invome",
        "nameAr": "4201 - إيرادات أخرى",
        "children": []
      },
      {
        "name": "5101 - Cost of Goods Sold",
        "nameAr": "5101 - تكلفة البضاعة المباعة",
        "children": []
      },
      {
        "name": "5102 - Salaries and Wages",
        "nameAr": "5102 - رواتب وأجور",
        "children": [
          {
            "glNumber": "510201",
            "name": "Salary Expense",
            "nameAr": "مصروف الرواتب",
          }
        ]
      },
      {
        "name": "5103 - Sales Comission",
        "nameAr": "5103 - عمولات البيع",
        "children": []
      },
      {
        "name": "5104 - Shipping and Custom Fees",
        "nameAr": "5104 - شحن وتخليص جمركي",
        "children": []
      },
      {
        "name": "5201 - Salaries & Admin Fees",
        "nameAr": "5201 - الرواتب والرسوم الإدارية",
        "children": []
      },
      {
        "name": "5202 - Medical Insurance",
        "nameAr": "5202 - تأمين طبي",
        "children": []
      },
      {
        "name": "5203 - Marketing and Advertising",
        "nameAr": "5203 - مصاريف تسويقية ودعائية",
        "children": []
      },
      {
        "name": "5204 - Rental Expenses",
        "nameAr": "5204 - مصاريف الإيجار",
        "children": []
      },
      {
        "name": "5205 - Commission & Incentives",
        "nameAr": "5205 - عمولات وحوافز",
        "children": []
      },
      {
        "name": "5206 - Travel Expense",
        "nameAr": "5206 - تذاكر سفر",
        "children": []
      },
      {
        "name": "5207 - Social Insurance Expenses",
        "nameAr": "5207 - التأمينات الاجتماعية",
        "children": []
      },
      {
        "name": "5208 - Government Fees",
        "nameAr": "5208 - الرسوم الحكومية",
        "children": []
      },
      {
        "name": "5209 - Fees and Subscriptions",
        "nameAr": "5209 - رسوم واشتراكات",
        "children": []
      },
      {
        "name": "5210 - Utilities Expenses",
        "nameAr": "5210 - مصاريف خدمات المكتب",
        "children": []
      },
      {
        "name": "5211 - Stationary and Prints",
        "nameAr": "5211 - مصاريف مكتبية ومطبوعات",
        "children": []
      },
      {
        "name": "5212 - Hospitality & Cleanliness",
        "nameAr": "5212 - مصاريف ضيافة",
        "children": []
      },
      {
        "name": "5213 -Bank Commission",
        "nameAr": "5213 - عمولات بنكية",
        "children": []
      },
      {
        "name": "5214 - Other Expenses",
        "nameAr": "5214 - مصاريف أخرى",
        "children": []
      },

      {
        "name": "5215 - Depreciation",
        "nameAr": "5215 - مصاريف الإهلاك",
        "children": [
          {
            "name": "521501 - Building Depreciation Expense",
            "nameAr": "521501 - مصروف إهلاك المباني",
            "glNumber": "1",
          },
          {
            "name": "521502 - Equipment Depreciation Expense",
            "nameAr": "521502 - مصروف إهلاك المعدات",
            "glNumber": "1",
          },
          {
            "name": "521503 - Computer & Prints Depreciation Expense",
            "nameAr": "521503 - مصروف إهلاك أجهزة مكتبية وطابعات",
            "glNumber": "1",
          }
        ]
      },
      {
        "name": "5219 - Transportation Expenses",
        "nameAr": "5219 - مصروف نقل ومواصلات",
        "children": []
      },
      {
        "name": "5220 - General Purchases",
        "nameAr": "5220 - مشتريات عامة",
        "children": [
          {
            "glNumber": "522001",
            "name": "General Purchases Expense",
            "nameAr": "مصروفات المشتريات العامة",
          }
        ]
      },
      {
        "name": "5221 - Inventory Count Gain/Loss",
        "nameAr": "5221 - الربح او الخسارة من الجرد",
        "children": [
          {
            "glNumber": "522101",
            "name": "Gain/Loss Inventory Count",
            "nameAr": "الخسارة والربح من الجرد",
          }
        ]
      },
      {
        "name": "5222 - Waste Expense",
        "nameAr": "5222 - مصروفات الهدر في الاصناف",
        "children": [
          {
            "glNumber": "522201",
            "name": "Waste Expense",
            "nameAr": "مصروفات الهدر في الاصناف",
          }
        ]
      },
      {
        "name": "5223 - Cost of Goods Sold",
        "nameAr": "5223 - مصروفات المنتجات المباعة",
        "children": [
          {
            "glNumber": "522301",
            "name": "Cost of Goods Sold",
            "nameAr": "مصروفات المنتجات المباعة",
          }
        ]
      },
      {
        "name": "5301 - Zakat",
        "nameAr": "5301 - الزكاة",
        "children": []
      },
      {
        "name": "5302 - Tax",
        "nameAr": "5302 - الضرائب",
        "children": []
      },
      {
        "name": "5303 - Change in Currency Value gains or loss",
        "nameAr": "5303 - ترجمة عملات أجنبية",
        "children": []
      },
      {
        "name": "5304 - Interest",
        "nameAr": "5304 - فوائد",
        "children": []
      },

    ];
    let allGLSet = [];

    let allGLAcct = [];

    console.log("Account Adding Start")
    for (const item of myExistingData) {
      const glGroupdto: CreateGlAccountGroupDto = {
        name: item.name,
        nameAr: item.nameAr
      }
      const glAccGroup = await this.glAccGroupService.create(req, glGroupdto);
      let glAccIds: any = [];

      if (item.children.length > 0 && item.name != '5215 - Depreciation' && item.name != '2109 - Accumulated Depreciation') {
        for (const child of item.children) {
          const glAccDto: any = {
            name: child.name,
            nameAr: child.nameAr,
            glNumber: Number(child.glNumber),
            glAccountGroupId: glAccGroup?._id
          }
          const glAcc = await this.glAccService.create(req, glAccDto);
          glAccIds.push(glAcc._id);
          allGLAcct.push({
            id: glAcc._id,
            name: child.name,
            nameAr: child.nameAr,
            glNumber: Number(child.glNumber)
          })
        }
      }

      if (item.name == '5215 - Depreciation' || item.name == '2109 - Accumulated Depreciation') {
        for (const child of item.children) {
          const glGroupdto1: CreateGlAccountGroupDto = {
            name: child.name,
            nameAr: child.nameAr
          }
          await this.glAccGroupService.create(req, glGroupdto1);
          const glSetdto1: CreateGlAccountSetDto = {
            name: child.name,
            nameAr: child.nameAr,
            glAccountIds: []
          }
          const glSet1 = await this.glAccSetService.create(req, glSetdto1);
          allGLSet.push({
            id: glSet1._id,
            name: child.name
          });
        }
      }

      const glSetdto: CreateGlAccountSetDto = {
        name: item.name,
        nameAr: item.nameAr,
        glAccountIds: glAccIds
      }
      const glSet = await this.glAccSetService.create(req, glSetdto);
      allGLSet.push({
        id: glSet._id,
        name: item.name
      });
    }

    let myCOARawData: CreateChartOfAccountDto = {
      "name": "Chart of Account",
      "nameAr": "الشجرة",
      "reportingGroup": [
        {
          "name": "1- Assets",
          "nameAr": "1-الاصول",
          "startOfGroup": null,
          "endOfGroup": null,
          "glAccountSetId": null,
          "order": 1,
          "indent": 0,
          "bold": false,
          "highlight": false,
          "children": [
            {
              "name": "11-Current Assets",
              "startOfGroup": "",
              "endOfGroup": "",
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "11-اصول متداولة",
              "glAccountSetId": null,
              "children": [
                {
                  "name": "1101 - Cash & Cash Equivaelant",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "glAccountSetId": allGLSet.find(f => f.name == '1101 - Cash & Cash Equivaelant').id.toString(),
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": " 1101 - النقد ومايعادله",
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "1102 - Cash in Bank",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "glAccountSetId": allGLSet.find(f => f.name == '1102 - Cash in Bank').id.toString(),
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1102 - النقدية في البنك",
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "1103 -  Receivables",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "glAccountSetId": allGLSet.find(f => f.name == '1103 -  Receivables').id.toString(),
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1103 - المدينون",
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "1104 - Advanced Payments",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1104 - مصروفات مقدمة",
                  "glAccountSetId": allGLSet.find(f => f.name == '1104 - Advanced Payments').id.toString(),
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "1105 - Advanced Employee Payment",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1105 - مدفوعات مقدمة للموظفين",
                  "glAccountSetId": allGLSet.find(f => f.name == '1105 - Advanced Employee Payment').id.toString(),
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "1106 - Inventories",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1106 - المخزون",
                  "glAccountSetId": allGLSet.find(f => f.name == '1106 - Inventories').id.toString(),
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "1107 - Suspense Accounts & Other Accounts",
                  "nameAr": "1107 - حسابات وسيطة واخرى",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "glAccountSetId": allGLSet.find(f => f.name == '1107 - Suspense Accounts & Other Accounts').id.toString(),
                  "indent": 2
                }
              ],
              "indent": 1
            },
            {
              "name": "12 - Non-Current Assets",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "1201 - Realestate & Equi",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [
                    {
                      "name": "120101 - Lands",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "120101 - الأراضي",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null
                    },
                    {
                      "name": "120102 - Buildings",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "120102 - المباني",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null,
                      "bold": false,
                    },
                    {
                      "name": "120103 - Equipments",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "120103 - المعدات",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null,
                    },
                    {
                      "name": "120104 - Office Equipment",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "120104 - أجهزة مكتبية وطابعات",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null,
                    }
                  ],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1201 - عقارات وآلات ومعدات",
                  "indent": 2,
                  "glAccountSetId": null,
                },
                {
                  "name": "1202 - Intangible Assets",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1202 - الأصول غير الملموسة",
                  "indent": 2,
                  "children": [],
                  "glAccountSetId": null,
                },
                {
                  "name": "1203 - Investment Estate",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "1203 - العقارات الاستثمارية",
                  "indent": 2,
                  "children": [],
                  "glAccountSetId": null,
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "12 - أصول غير متداولة",
              "indent": 1,
              "glAccountSetId": null,
            }
          ],
          "negativeNature": false
        },
        {
          "name": "2 - Liabilities",
          "nameAr": "2 - الالتزامات",
          "startOfGroup": null,
          "endOfGroup": null,
          "glAccountSetId": null,
          "order": 1,
          "indent": 0,
          "highlight": false,
          "children": [
            {
              "name": "21 - Current Liabilities",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "2101 - Account Payables",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2101 - الدائنون",
                  "glAccountSetId": allGLSet.find(f => f.name == '2101 - Account Payables').id.toString(),
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "2102 - Accrued Expenses",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2102 - مصروفات مستحقة",
                  "glAccountSetId": allGLSet.find(f => f.name == '2102 - Accrued Expenses').id.toString(),
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "2103 - Accrued Salaries",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2103 - الرواتب المستحقة",
                  "glAccountSetId": allGLSet.find(f => f.name == '2103 - Accrued Salaries').id.toString(),
                  "indent": 2,
                  "children": []
                },
                {
                  "name": "2104 - Short-Term Loans",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2104 - قروض قصيرة الأجل",
                  "indent": 2,
                  "children": [],
                  "glAccountSetId": null
                },
                {
                  "name": "2105 - VAT Tax Payable",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2105 - ضريبة القيمة المضافة المستحقة",
                  "glAccountSetId": allGLSet.find(f => f.name == '2105 - VAT Tax Payable').id.toString(),
                  "indent": 2,
                  "children": [],
                },
                {
                  "name": "2106 - Accrued Tax",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2106 - الضرائب المستحقة - الشركات الاجنبية",
                  "indent": 2,
                  "children": [],
                  "glAccountSetId": null
                },
                {
                  "name": "2107 -Unearned revenues",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2107 - إيرادات غير مكتسبة",
                  "indent": 2,
                  "children": [],
                  "glAccountSetId": null
                },
                {
                  "name": "2108 -  Social Security fees Payable",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2108 - مستحقات المؤسسة العامة للتأمينات الاجتماعية",
                  "indent": 2,
                  "children": [],
                  "glAccountSetId": null
                },
                {
                  "name": "2109 - Accumulated Depreciation",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [
                    {
                      "name": "210901- Buildings accumulated depreciation",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "210901- مجمع استهلاك المباني",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null
                    },
                    {
                      "name": "210902- Equipment accumulated depreciation",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "210902 - مجمع استهلاك المعدات",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null
                    },
                    {
                      "name": "210903 - Computers & printers accumulated depreciation",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "210903 - مجمع استهلاك أجهزة مكتبية وطابعات",
                      "indent": 3,
                      "children": [],
                      "glAccountSetId": null
                    }
                  ],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2109 - مجمع الاستهلاك",
                  "indent": 2,
                  "glAccountSetId": null
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "21 - الالتزامات المتداولة",
              "indent": 1,
              "glAccountSetId": null
            },
            {
              "name": "22 - Non-current Liability",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "2201 - Long Term Loans",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2201 - قروض طويلة أجل",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "2202 - End of Services Provision",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "2202 - مخصص مكافأة نهاية الخدمة",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "22 - التزامات غير متداولة",
              "indent": 1,
              "glAccountSetId": null,
              "bold": false
            }
          ],
          "negativeNature": false,
          "bold": false
        },
        {
          "name": "3 - Equity",
          "nameAr": "3 - حقوق الملكية",
          "startOfGroup": null,
          "endOfGroup": null,
          "glAccountSetId": null,
          "order": 3,
          "indent": 0,
          "bold": false,
          "highlight": false,
          "children": [
            {
              "name": "31 - Issued Capital",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "3101 - Registered Capital",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3101 - رأس المال المسجل",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "3102 - Additional Paid Capital",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3102 - رأس المال الإضافي المدفوع",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "31 - رأس المال",
              "indent": 1,
              "glAccountSetId": null
            },
            {
              "name": "32 - Other Equity",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "3201 - Opening Balance",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3201 - أرصدة افتتاحية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "32 - حقوق ملكية أخرى",
              "indent": 1,
              "glAccountSetId": null
            },
            {
              "name": "33 - Reserve",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "3301 - Statutory Reserve",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3301 - احتياطي نظامي",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "3302 - Foreign Currency Translation Reserve",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3302 - احتياطي ترجمة عملات أجنبية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "33 - احتياطيات",
              "indent": 1,
              "glAccountSetId": null
            },
            {
              "name": "34 - Retained Earnings or Loss",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "3401 - Profit & Loss",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3401 - الأرباح والخسائر العاملة",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "3402 - Retained Earnings or Loss",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "3402 - الأرباح المبقاة (أو الخسائر)",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "34 - الأرباح المبقاة (أو الخسائر)",
              "indent": 1,
              "glAccountSetId": null
            }
          ],
          "negativeNature": false,
        },
        {
          "name": "4 - Revenue",
          "nameAr": "4 - الإيرادات",
          "startOfGroup": null,
          "endOfGroup": null,
          "glAccountSetId": null,
          "order": 1,
          "indent": 0,
          "bold": false,
          "highlight": false,
          "children": [
            {
              "name": "41 - Operational Revenue",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "4101 - Revenue of Products and Services Sales",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "4101 - إيرادات المبيعات/ الخدمات",
                  "glAccountSetId": allGLSet.find(f => f.name == '4101 - Revenue of Products and Services Sales').id.toString(),
                  "indent": 2,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "41 - الإيرادات التشغيلية",
              "indent": 1,
              "glAccountSetId": null
            },
            {
              "name": "42 - Non-Operating Revenue",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "4201 - Other Invome",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "4201 - إيرادات أخرى",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "42 - الإيرادات غير التشغيلية",
              "indent": 1,
              "glAccountSetId": null
            }
          ],
          "negativeNature": false
        },
        {
          "name": "5 - Expenses",
          "nameAr": "5 - المصاريف",
          "startOfGroup": null,
          "endOfGroup": null,
          "glAccountSetId": null,
          "order": 1,
          "indent": 0,
          "bold": false,
          "highlight": false,
          "children": [
            {
              "name": "51 - Direct Cost",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "5101 - Cost of Goods Sold",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5101 - تكلفة البضاعة المباعة",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5102 - Salaries and Wages",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5102 - رواتب وأجور",
                  "indent": 2,
                  "glAccountSetId": allGLSet.find(f => f.name == '5102 - Salaries and Wages').id.toString(),
                  "children": []
                },
                {
                  "name": "5103 - Sales Comission",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5103 - عمولات البيع",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5104 - Shipping and Custom Fees",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5104 - شحن وتخليص جمركي",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "51 - التكاليف المباشرة",
              "indent": 1,
              "glAccountSetId": null
            },
            {
              "name": "52 - Operational Cost",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "5201 - Salaries & Admin Fees",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5201 - الرواتب والرسوم الإدارية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5202 - Medical Insurance",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 2,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5202 - تأمين طبي",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5203 - Marketing and Advertising",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5203 - مصاريف تسويقية ودعائية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5204 - Rental Expenses",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5204 - مصاريف الإيجار",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5205 - Commission & Incentives",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5205 - عمولات وحوافز",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5206 - Travel Expense",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5206 - تذاكر سفر",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5207 - Social Insurance Expenses",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5207 - التأمينات الاجتماعية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5208 - Government Fees",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5208 - الرسوم الحكومية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5209 - Fees and Subscriptions",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5209 - رسوم واشتراكات",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5210 - Utilities Expenses",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5210 - مصاريف خدمات المكتب",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5211 - Stationary and Prints",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5211 - مصاريف مكتبية ومطبوعات",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5212 - Hospitality & Cleanliness",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5212 - مصاريف ضيافة",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5213 -Bank Commission",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5213 - عمولات بنكية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5214 - Other Expenses",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5214 - مصاريف أخرى",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5215 - Depreciation",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [
                    {
                      "name": "521501 - Building Depreciation Expense",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "521501 - مصروف إهلاك المباني",
                      "indent": 3,
                      "glAccountSetId": null,
                      "children": [],
                      "bold": false
                    },
                    {
                      "name": "521502 - Equipment Depreciation Expense",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "521502 - مصروف إهلاك المعدات",
                      "indent": 3,
                      "glAccountSetId": null,
                      "children": []
                    },
                    {
                      "name": "521503 - Computer & Prints Depreciation Expense",
                      "startOfGroup": "",
                      "endOfGroup": "",
                      "order": 1,
                      "bold": false,
                      "highlight": false,
                      "negativeNature": false,
                      "nameAr": "521503 - مصروف إهلاك أجهزة مكتبية وطابعات",
                      "indent": 3,
                      "glAccountSetId": null,
                      "children": []
                    }
                  ],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5215 - مصاريف الإهلاك",
                  "indent": 2,
                  "glAccountSetId": null
                },
                {
                  "name": "5219 - Transportation Expenses",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5219 - مصروف نقل ومواصلات",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5220 - General Purchases",
                  "nameAr": "5220 - مشتريات عامة",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "glAccountSetId": allGLSet.find(f => f.name == '5220 - General Purchases').id.toString(),
                  "indent": 2,
                },
                {
                  "name": "5221 - Inventory Count Gain/Loss",
                  "nameAr": "5221 - الربح او الخسارة من الجرد",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "glAccountSetId": allGLSet.find(f => f.name == '5221 - Inventory Count Gain/Loss').id.toString(),
                  "indent": 2,
                },
                {
                  "name": "5222 - Waste Expense",
                  "nameAr": "5222 - مصروفات الهدر في الاصناف",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "glAccountSetId": allGLSet.find(f => f.name == '5222 - Waste Expense').id.toString(),
                  "indent": 2
                },
                {
                  "name": "5223 - Cost of Goods Sold",
                  "nameAr": "5223 - مصروفات المنتجات المباعة",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "children": [],
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "glAccountSetId": allGLSet.find(f => f.name == '5223 - Cost of Goods Sold').id.toString(),
                  "indent": 2
                }
              ],
              "order": 1,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "52 - التكاليف التشغيلية",
              "indent": 1,
              "glAccountSetId": null,
              "bold": false
            },
            {
              "name": "53 - None-Operational Expenses",
              "startOfGroup": "",
              "endOfGroup": "",
              "children": [
                {
                  "name": "5301 - Zakat",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5301 - الزكاة",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5302 - Tax",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5302 - الضرائب",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5303 - Change in Currency Value gains or loss",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5303 - ترجمة عملات أجنبية",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                },
                {
                  "name": "5304 - Interest",
                  "startOfGroup": "",
                  "endOfGroup": "",
                  "order": 1,
                  "bold": false,
                  "highlight": false,
                  "negativeNature": false,
                  "nameAr": "5304 - فوائد",
                  "indent": 2,
                  "glAccountSetId": null,
                  "children": []
                }
              ],
              "order": 1,
              "bold": false,
              "highlight": false,
              "negativeNature": false,
              "nameAr": "53 - مصاريف غير التشغيلية",
              "indent": 1,
              "glAccountSetId": null
            }
          ],
          "negativeNature": false,
        }
      ]
    }


    await this.coaService.create(req, myCOARawData);

    const glAccmapping: CreateGlAccountMappingDto = {
      "accountReceivable": {
        "glAccount": allGLAcct.find(f => f.name == 'Account Receivable').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "avgPriceChange": {
        "glAccount": allGLAcct.find(f => f.name == 'Price Change Offsetting Account').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "bank": {
        "glAccount": allGLAcct.find(f => f.name == 'Alrajhi Bank').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "card": {
        "glAccount": allGLAcct.find(f => f.name == 'Alrajhi Bank').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "cash": {
        "glAccount": allGLAcct.find(f => f.name == 'Cash').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "cogsAccount": {
        "glAccount": allGLAcct.find(f => f.name == 'Cost of Goods Sold').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "crOutputTax": {
        "glAccount": allGLAcct.find(f => f.name == 'Output VAT').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "crRevenue": {
        "glAccount": allGLAcct.find(f => f.name == 'Revenue').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "crShishaTax": {
        "glAccount": allGLAcct.find(f => f.name == 'Shisha Tax').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "customerAccountReceivables": {
        "glAccount": allGLAcct.find(f => f.name == 'Account Receivable').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "deferred": {
        "glAccount": allGLAcct.find(f => f.name == 'Account Receivable').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "drInputTax": {
        "glAccount": allGLAcct.find(f => f.name == 'Input Tax (Vendor)').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "gainAndLoss": {
        "glAccount": allGLAcct.find(f => f.name == 'Gain/Loss Inventory Count').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "glVenCodes": [
        {
          "glVenCodeId": vendorId,
          "glAccount": allGLAcct.find(f => f.name == 'Accounts Payable (A/P)').id.toString(),
          "costCenter": null,
          "segment": null,
          "purpose": null
        }
      ],
      "materialCodes": [
        {
          "glMatCodeId": matCodeId,
          "invengtoryGlAccount": allGLAcct.find(f => f.name == 'All Inventory').id.toString(),
          "grirGlAccount": allGLAcct.find(f => f.name == 'GRIR Suspense Account').id.toString(),
          "costCenter": null,
          "segment": null,
          "purpose": null
        }
      ],
      "online": {
        "glAccount": allGLAcct.find(f => f.name == 'Alrajhi Bank').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "purchaseCategories": [
        {
          "category": poCatId,
          "glAccount": allGLAcct.find(f => f.name == 'General Purchases Expense').id.toString(),
          "costCenter": null,
          "segment": null,
          "purpose": null
        }
      ],
      "sfInterCompany": {
        "glAccount": null,
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "softPos": {
        "glAccount": allGLAcct.find(f => f.name == 'Alrajhi Bank').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "taxClearing": {
        "glAccount": null,
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "wasteExpense": {
        "glAccount": allGLAcct.find(f => f.name == 'Waste Expense').id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "salaryAccural": {
        "glAccount": allGLAcct.find(f => f.name == 'Accrued Salaries,Wages')?.id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "salaryExpense": {
        "glAccount": allGLAcct.find(f => f.name == 'Salary Expense')?.id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "employeeExpense": {
        "glAccount": allGLAcct.find(f => f.name == 'Salary Expense')?.id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "consumptionGlAccount": {
        "glAccount": allGLAcct.find(f => f.name == 'Salary Expense')?.id.toString(),
        "costCenter": null,
        "segment": null,
        "purpose": null
      },
      "glRevenueCodes": [
        {
          "glRevenueCodeId": revCodeId,
          "glAccount": allGLAcct.find(f => f.name == 'Revenue')?.id.toString(),
          "costCenter": null,
          "segment": null,
          "purpose": null
        }
      ],
      "glAssetCodes": [
        {
          "glAssetCodeId": assetCodeId,
          "assetAccount": allGLAcct.find(f => f.name == 'Revenue')?.id.toString(),
          "accumulatedAccount": null,
          "depreciationExpenseAccount": null,
          "retirementLossAccount": null,
          "costCenter": null,
          "segment": null,
          "purpose": null
        }
      ],
      "glTaxIndicationCodes": [
        {
          "glAccount": allGLAcct.find(f => f.name == 'Revenue')?.id.toString(),
          "glTaxIndicationId": null,
          "costCenter": null,
          "purpose": null,
          "segment": null
        }
      ]

    }

    await this.glaccMapService.create(req, glAccmapping);

  }

  async createDefaultPrimeCostTemplate(req) {
    const dto: CreatePrimeCostTemplateDto = {
      "name": "Prime Cost Template",
      "nameAr": "قالب التكلفة الرئيسية",
      "salesGroup": [
        {
          "name": "Food & Soft Beverage",
          "nameAr": "الطعام والمشروبات",
          "indent": 0,
          "glAccountIds": [],
          "children": [],
          "code": "FOOD"
        },
        {
          "name": "Merchandise & Other",
          "nameAr": "البضائع والأخرى",
          "indent": 0,
          "glAccountIds": [],
          "children": [],
          "code": "MERCHANDISE"
        }
      ],
      "cogsGroup": [
        {
          "name": "Food",
          "nameAr": "الطعام",
          "indent": 0,
          "glAccountIds": [],
          "salesGroupId": null,
          "children": [
            {
              "name": "Food",
              "nameAr": "الطعام",
              "indent": 1,
              "glAccountIds": [],
              "salesGroupId": "FOOD",
              "children": []
            },
            {
              "name": "Soft Beverage",
              "nameAr": "المشروبات",
              "indent": 1,
              "glAccountIds": [],
              "salesGroupId": "FOOD",
              "children": []
            }
          ],

        },
        {
          "name": "Others",
          "nameAr": "الآخرين",
          "indent": 0,
          "glAccountIds": [],
          "salesGroupId": null,
          "children": [
            {
              "name": "Paper",
              "nameAr": "الورق",
              "indent": 1,
              "glAccountIds": [],
              "salesGroupId": "MERCHANDISE",
              "children": []
            },
            {
              "name": "Merchandise & Other",
              "nameAr": "البضائع والأخرى",
              "indent": 1,
              "glAccountIds": [],
              "salesGroupId": "MERCHANDISE",
              "children": []
            }
          ]
        }
      ],
      "laborGroup": [
        {
          "name": "Monthly",
          "nameAr": "الشهري",
          "indent": 0,
          "glAccountIds": [],
          "salesGroupId": null,
          "children": []
        },
        {
          "name": "Hourly Personnel",
          "nameAr": "فريق العمل بالساعة",
          "indent": 0,
          "glAccountIds": [],
          "salesGroupId": null,
          "children": []
        }
      ]
    }

    await this.primeCostService.createTemplate(req, dto);
  }
  async createDefaultProfitLossTemplate(req) {
    await this.profitLossService.defaultTemplate(req);
  }
  async createDefaultBalanceSheetTemplate(req) {
    await this.balanceSheetService.defaultTemplate(req);
  }
}
