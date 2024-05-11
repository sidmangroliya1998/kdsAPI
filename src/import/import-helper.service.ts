import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImportDto } from './dto/import.dto';
import { ImportType } from './enum/import.enum';
import Excel = require('exceljs');
import {
  MenuItemOutputTemplate,
  MenuItemTemplate,
  OrderOutputTemplate,
  OrderTemplate,
  restaurantOutputTemplate,
  restaurantTemplate,
  supplierOutputTemplate,
  supplierTemplate,
} from './constants/import.constant';
import { SupplierService } from 'src/supplier/Supplier.service';
import { S3Service } from 'src/core/Providers/Storage/S3.service';
import { InjectModel } from '@nestjs/mongoose';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { Model } from 'mongoose';
import { Import, ImportDocument } from './schemas/import.schema';
import { RoleSlug } from 'src/core/Constants/enum';
import { UserService } from 'src/users/users.service';
import { Role, RoleDocument } from 'src/role/schemas/roles.schema';
import { RestaurantService } from 'src/restaurant/restaurant.service';
import { MenuItemService } from 'src/menu/service/menu-item.service';
import { MenuCategoryService } from 'src/menu/service/menu-category.service';
import { OrderService } from 'src/order/order.service';
import { CreateOrderDto } from 'src/order/dto/create-order.dto';
import { roundOffNumber } from '../core/Helpers/universal.helper';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentMethod } from 'src/payment/enum/en.enum';

@Injectable()
export class ImportHelperService {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly restaurantService: RestaurantService,
    private readonly menuItemService: MenuItemService,
    private readonly menuCategoryService: MenuCategoryService,
    private readonly s3Service: S3Service,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,

    private userService: UserService,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItemDocument>,
  ) {}

  async handleSupplierImport(req, file, importObj) {
    const workBook = new Excel.Workbook();

    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);

    const response = [];
    const fields = Object.keys(supplierTemplate);
    const adminRole = await this.roleModel.findOne({
      slug: RoleSlug.SupplierAdmin,
    });
    const defaultPassword = 'Test@123456';

    worksheet.getRow(1).getCell(supplierOutputTemplate.dataId).value =
      'SupplierId';
    worksheet.getRow(1).getCell(supplierOutputTemplate.error).value = 'Error';

    for (let i = 2; i <= worksheet.rowCount; i++) {
      console.log(fields, supplierTemplate[fields[i]]);
      const row: any = [];
      for (const j in fields) {
        row[fields[j]] = worksheet
          .getRow(i)
          .getCell(supplierTemplate[fields[j]])
          .toString();
      }
      row['defaultWorkingHours'] = {
        start: row['defaultWorkingHoursStart'],
        end: row['defaultWorkingHoursEnd'],
      };
      try {
        const supplier = await this.supplierService.createSupplier(req, {
          ...row,
          importId: importObj._id,
        });

        const userCreateReq: any = {
          email: row['email'],
          password: defaultPassword,
          supplierId: supplier._id,
          role: adminRole?._id,
        };
        console.log(userCreateReq);
        await this.userService.create(null, userCreateReq);
        worksheet.getRow(i).getCell(supplierOutputTemplate.dataId).value =
          supplier._id.toString();
        response.push({ rowNumber: i, success: true, dataId: supplier._id });
      } catch (err) {
        worksheet.getRow(i).getCell(supplierOutputTemplate.dataId).value = 'NA';
        worksheet.getRow(i).getCell(supplierOutputTemplate.error).value =
          err.toString();
        response.push({ rowNumber: i, success: false, error: err });
      }
    }
    await workBook.xlsx.writeFile(file.path);
    this.storeImportStatus(file, importObj, response);
  }

  async handleRestaurantImport(req, file, importObj) {
    const workBook = new Excel.Workbook();

    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);

    const response = [];

    worksheet.getRow(1).getCell(restaurantOutputTemplate.dataId).value =
      'RestaurantId';
    worksheet.getRow(1).getCell(restaurantOutputTemplate.error).value = 'Error';

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const rowObj = worksheet.getRow(i);
      const row: any = {
        name: rowObj.getCell(restaurantTemplate.name).toString(),
        nameAr: rowObj.getCell(restaurantTemplate.nameAr).toString(),
        city: rowObj.getCell(restaurantTemplate.city).toString(),
        whatsappNumber: rowObj
          .getCell(restaurantTemplate.whatsappNumber)
          .toString(),
        enableWhatsappCommunication:
          rowObj
            .getCell(restaurantTemplate.enableWhatsappCommunication)
            .toString()
            .toLowerCase() == 'yes'
            ? true
            : false,
        beforeConfirmOrderMessage: {
          en: rowObj
            .getCell(restaurantTemplate.beforeConfirmOrderMessageEng)
            .toString(),
          ar: rowObj
            .getCell(restaurantTemplate.beforeConfirmOrderMessageAr)
            .toString(),
        },
        defaultWorkingHours: {
          start: rowObj
            .getCell(restaurantTemplate.defaultWorkingHoursStart)
            .toString(),
          end: rowObj
            .getCell(restaurantTemplate.defaultWorkingHoursEnd)
            .toString(),
        },
        location: {
          address: rowObj.getCell(restaurantTemplate.address).toString(),
          city: rowObj.getCell(restaurantTemplate.city).toString(),
          state: rowObj.getCell(restaurantTemplate.state).toString(),
          zipCode: rowObj.getCell(restaurantTemplate.zipCode).toString(),
          country: rowObj.getCell(restaurantTemplate.country).toString(),
          latitude: rowObj.getCell(restaurantTemplate.latitude).toString(),
          longitude: rowObj.getCell(restaurantTemplate.longitude).toString(),
          district: rowObj.getCell(restaurantTemplate.district).toString(),
        },
        importId: importObj._id,
        supplierId: rowObj.getCell(restaurantTemplate.supplierId).toString(),
      };

      try {
        const restaurant = await this.restaurantService.create(
          { ...req, supplierId: row.supplierId },
          {
            ...row,
          },
        );

        worksheet.getRow(i).getCell(restaurantOutputTemplate.dataId).value =
          restaurant._id.toString();
        response.push({ rowNumber: i, success: true, dataId: restaurant._id });
      } catch (err) {
        worksheet.getRow(i).getCell(restaurantOutputTemplate.dataId).value =
          'NA';
        worksheet.getRow(i).getCell(restaurantOutputTemplate.error).value =
          err.toString();
        response.push({ rowNumber: i, success: false, error: err });
      }
    }
    await workBook.xlsx.writeFile(file.path);
    this.storeImportStatus(file, importObj, response);
  }

  async handleMenuImport(req, file, importObj) {
    const workBook = new Excel.Workbook();

    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);

    const response = [];
    worksheet.getRow(1).getCell(MenuItemOutputTemplate.dataId).value =
      'MenuItemId';
    worksheet.getRow(1).getCell(MenuItemOutputTemplate.error).value = 'Error';
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const rowObj = worksheet.getRow(i);
      const supplierId = rowObj.getCell(MenuItemTemplate.supplierId).toString();
      const categoryDto: any = {
        name: rowObj.getCell(MenuItemTemplate.category).toString(),
        nameAr: rowObj.getCell(MenuItemTemplate.categoryAr).toString(),
        importId: importObj._id,
      };
      const menuCategory = await this.menuCategoryService.create(
        {
          ...req,
          supplierId: supplierId,
        },
        categoryDto,
      );
      const row: any = {
        name: rowObj.getCell(MenuItemTemplate.name).toString(),
        nameAr: rowObj.getCell(MenuItemTemplate.nameAr).toString(),
        description: rowObj.getCell(MenuItemTemplate.description).toString(),
        descriptionAr: rowObj
          .getCell(MenuItemTemplate.descriptionAr)
          .toString(),
        importId: importObj._id,
        categoryId: menuCategory._id,
        price: parseFloat(rowObj.getCell(MenuItemTemplate.price).toString()),
        image: rowObj.getCell(MenuItemTemplate.image).toString(),
        calories: parseFloat(
          rowObj.getCell(MenuItemTemplate.calories).toString(),
        ),
        manageQuantity:
          rowObj
            .getCell(MenuItemTemplate.manageQuantity)
            .toString()
            .toLowerCase() == 'true'
            ? true
            : false,
        order: parseInt(rowObj.getCell(MenuItemTemplate.order).toString()),
      };
      try {
        const menuItem = await this.menuItemService.create(
          { ...req, supplierId: supplierId },
          {
            ...row,
          },
        );

        worksheet.getRow(i).getCell(MenuItemOutputTemplate.dataId).value =
          menuItem._id.toString();
        response.push({ rowNumber: i, success: true, dataId: menuItem._id });
      } catch (err) {
        worksheet.getRow(i).getCell(MenuItemOutputTemplate.dataId).value = 'NA';
        worksheet.getRow(i).getCell(MenuItemOutputTemplate.error).value =
          err.toString();
        response.push({ rowNumber: i, success: false, error: err });
      }
    }
    await workBook.xlsx.writeFile(file.path);
    this.storeImportStatus(file, importObj, response);
  }

  async handleOrderImport(req, file, importObj: ImportDocument) {
    const workBook = new Excel.Workbook();

    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);

    const response = [];
    worksheet.getRow(1).getCell(OrderOutputTemplate.dataId).value = 'OrderId';
    worksheet.getRow(1).getCell(OrderOutputTemplate.error).value = 'Error';
    let tempGrouping = null;
    let payments = [];
    let items = [];
    let dto: any = {};
    let lastRowNumber = 0;
    console.log(worksheet.actualRowCount);
    for (let i = 2; i <= worksheet.actualRowCount; i++) {
      const rowObj = worksheet.getRow(i);
      lastRowNumber = i;
      const currentOrderGrouping = parseInt(
        rowObj.getCell(OrderTemplate.grouping).toString(),
      );
      if (!rowObj.getCell(OrderTemplate.itemId).toString()) {
        continue;
      }
      try {
        if (tempGrouping != currentOrderGrouping) {
          tempGrouping = currentOrderGrouping;
          console.log(items);
          if (items.length > 0) {
            const order = await this.orderService.create(req, dto);
            for (const j in payments) {
              const item = order.items.find(
                (oi) => oi.menuItem.menuItemId.toString() == payments[j].itemId,
              );
              if (item) {
                await this.paymentService.create(req, {
                  orderId: order._id.toString(),
                  amount: item.amountAfterDiscount,
                  paymentMethod:
                    payments[j].paymentMethod.toLowerCase() == 'card'
                      ? PaymentMethod.Card
                      : PaymentMethod.Cash,
                });
              }
            }
            worksheet.getRow(i).getCell(OrderOutputTemplate.dataId).value =
              order._id.toString();
            response.push({ rowNumber: i, success: true, dataId: order._id });
            items = [];
            payments = [];
            dto = {};
          }
          const menuItem = await this.menuItemModel.findById(
            rowObj.getCell(OrderTemplate.itemId).toString(),
          );
          if (!menuItem) {
            throw new BadRequestException(
              `Menu Item - ${rowObj
                .getCell(OrderTemplate.itemId)
                .toString()} not found`,
            );
          }
          let priceDto: any = {};
          if (menuItem.isDynamicPrice) {
            priceDto = {
              price: roundOffNumber(
                parseFloat(
                  rowObj.getCell(OrderTemplate.grossAmount).toString(),
                ) / parseInt(rowObj.getCell(OrderTemplate.quantity).toString()),
              ),
            };
          }
          items.push({
            menuItem: {
              menuItemId: rowObj.getCell(OrderTemplate.itemId).toString(),
            },
            quantity: parseInt(
              rowObj.getCell(OrderTemplate.quantity).toString(),
            ),
            ...priceDto,
          });
          payments.push({
            itemId: rowObj.getCell(OrderTemplate.itemId).toString(),
            paymentMethod: rowObj
              .getCell(OrderTemplate.paymentMethod)
              .toString(),
          });
          dto = {
            createdAt: new Date(rowObj.getCell(OrderTemplate.date).toString()),
            items,
            restaurantId: rowObj.getCell(OrderTemplate.restaurantId).toString(),
            source: rowObj.getCell(OrderTemplate.source).toString(),
            orderType: rowObj.getCell(OrderTemplate.type).toString(),
            marketPlaceType: rowObj
              .getCell(OrderTemplate.marketPlace)
              .toString(),
            skipTableValidation: true,
          };
        }
      } catch (err) {
        worksheet.getRow(i).getCell(OrderOutputTemplate.dataId).value = 'NA';
        worksheet.getRow(i).getCell(OrderOutputTemplate.error).value =
          err.toString();
        response.push({ rowNumber: i, success: false, error: err });
      }
    }
    try {
      if (items.length > 0) {
        const order = await this.orderService.create(req, dto);
        for (const j in payments) {
          const item = order.items.find(
            (oi) => oi.menuItem.menuItemId.toString() == payments[j].itemId,
          );
          if (item) {
            await this.paymentService.create(req, {
              orderId: order._id.toString(),
              amount: item.amountAfterDiscount,
              paymentMethod:
                payments[j].paymentMethod.toLowerCase() == 'card'
                  ? PaymentMethod.Card
                  : PaymentMethod.Cash,
            });
          }
        }
        worksheet
          .getRow(lastRowNumber)
          .getCell(OrderOutputTemplate.dataId).value = order._id.toString();
        response.push({
          rowNumber: lastRowNumber,
          success: true,
          dataId: order._id,
        });
        items = [];
        payments = [];
        dto = {};
      }
    } catch (err) {
      worksheet
        .getRow(lastRowNumber)
        .getCell(OrderOutputTemplate.dataId).value = 'NA';
      worksheet.getRow(lastRowNumber).getCell(OrderOutputTemplate.error).value =
        err.toString();
      response.push({ rowNumber: lastRowNumber, success: false, error: err });
    }

    await workBook.xlsx.writeFile(file.path);
    this.storeImportStatus(file, importObj, response);
  }

  async storeImportStatus(file, importObj, response) {
    const res = await this.s3Service.uploadFile(file, 'imports/');
    importObj.url = res ? res.Location : null;
    importObj.importRes = response;
    importObj.status = 'completed';
    await importObj.save();
  }
}
