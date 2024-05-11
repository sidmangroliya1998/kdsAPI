import * as request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from 'src/app.module';

import { MongooseModuleOptions } from '@nestjs/mongoose';
import {
  ValidationPipe,
  CACHE_MANAGER,
  CacheModuleOptions,
  CACHE_MODULE_OPTIONS,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { createSupplierAdmin, populateData } from '../__utils__';

import { contentParser } from 'fastify-file-interceptor';

import mongoose from 'mongoose';
import { SocketAdapter } from 'src/core/adapters/socket.adapter';
import { AdminLoginDto, LoginRequestDto } from 'src/auth/dto/login-request.dto';
import { admins } from 'test/stubs/admins.stub';
import { AddSupplierDto } from 'src/supplier/Supplier.dto';
import { supplierStub } from 'test/stubs/supplier.stub';
import { UserCreateDto } from 'src/users/dto/users.dto';
import { users } from 'test/stubs/users.stub';
import { CreateRestaurantDto } from 'src/restaurant/dto/create-restaurant.dto';
import { CreateRestaurantData } from '../../src/test-data/data/create-restaurant-data.dto';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { CreateListDto } from 'src/list/dto/create-list.dto';
import { tableData, tableRegionData } from 'src/test-data/data/table-data';
import { CreateTableDto } from 'src/table/dto/create-table.dto';
import { CreateKitchenQueueDto } from 'src/kitchen-queue/dto/create-kitchen-queue.dto';
import { kitchenQueueData } from 'src/test-data/data/kitchen-queue-data';
import { CreateCashierDto } from 'src/cashier/dto/create-cashier.dto';
import { CashierData } from 'src/test-data/data/cashier-data';
import { PaymentSetupData } from 'src/test-data/data/payment-setup-data';
import { CreatePaymentSetupDto } from 'src/payment-setup/dto/create-payment-setup.dto';
import { MenuCategoryData, MenuItemData } from 'src/test-data/data/menu-data';
import { CreateMenuItemDTO } from 'src/menu/dto/menu-item.dto';
import { CreateOrderDto } from 'src/order/dto/create-order.dto';
import {
  InvoiceStatus,
  OrderPaymentStatus,
  OrderStatus,
  OrderType,
  Source,
} from 'src/order/enum/en.enum';
import { PaymentInitiateDto } from 'src/payment/dto/payment.dto';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { CreatePrinterDto } from 'src/printer/dto/create-printer.dto';
import { printers } from 'test/stubs/printers.stub';
import { GroupOrderDto } from 'src/order/dto/group-order.dto';
import { CreateOfferDto } from 'src/offer/dto/create-offer.dto';
import { offers } from 'test/stubs/offers.stub';
import { CacheService } from 'src/cache/cache.service';
import * as redisStore from 'cache-manager-redis-store';

let mongo = null;
let uri =
  'mongodb+srv://gti_test:jPylJJJobANUHOBE@gti-test.120gszt.mongodb.net/test';
let app: NestFastifyApplication;
let moduleRef: TestingModule = null;
class TestRedisProvider {
  xAdd = jest.fn();
  add = jest.fn();
}
jest.setTimeout(60000);
beforeAll(async () => {
  // mongo = await MongoMemoryServer.create({
  //   instance: {
  //     dbName: 'test',
  //     // ip: '::,0.0.0.0',
  //     // port: 37017,
  //   },
  // });
  //uri = await mongo.getUri();
  await mongoose.connect(uri, { dbName: 'test' });
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoose.connection.close();
  moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('MongooseModuleOptions')
    .useFactory({
      factory: async (): Promise<MongooseModuleOptions> => ({
        uri,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'test',
      }),
      inject: [],
    })
    .overrideProvider(CACHE_MODULE_OPTIONS)
    .useValue({
      // your options go here (minus host and port and store), or you can leave as an empty object
      store: 'memory',
    })
    .compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  app.register(contentParser);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      validateCustomDecorators: true,
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useWebSocketAdapter(new SocketAdapter(app));
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  // await app.listen(9000);

  await populateData(uri);
});

afterAll(async () => {
  // await mongoose.connection.dropDatabase();

  await mongoose.connection.close();
  await moduleRef.close();
  // await mongo.stop();
  await app.close();
});

// beforeEach(async () => {
//   //await mongoose.disconnect();
//   await mongoose.connect(uri, { dbName: 'test' });
// });

// afterEach(async () => {
//   await mongoose.disconnect();
// });

//Auth Module
let adminUser = null,
  supplier: SupplierDocument = null,
  supplierAdmin = null;
it('Genereating Auth token for Admin', async () => {
  const loginRequestDto: AdminLoginDto = {
    email: admins[0].email,
    password: 'Test@12345',
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/auth/admin-login')
    .send(loginRequestDto);
  expect(statusCode).toBe(201);
  adminUser = { ...body };
  console.log(adminUser);
});

it('Creating Supplier', async () => {
  const dto: AddSupplierDto = {
    ...supplierStub,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/supplier')
    .set('Authorization', 'Bearer ' + adminUser.accessToken)
    .send(dto);
  expect(statusCode).toBe(201);
  supplier = { ...body };
  console.log(supplier);
});

it('Creating Supplier Admin', async () => {
  await createSupplierAdmin(uri, supplier);
});

it('Generating Auth Token for Supplier Admin', async () => {
  const dto: LoginRequestDto = {
    email: users[0].email,
    password: 'Test@12345',
    alias: supplier.alias,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/auth/login')
    .send(dto);
  expect(statusCode).toBe(201);
  supplierAdmin = { ...body };
  console.log(supplierAdmin);
});

it('Create Cashier Printer', async () => {
  const dto: CreatePrinterDto = {
    ...printers[0],
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/printer')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Kitchen Printer', async () => {
  const dto: CreatePrinterDto = {
    ...printers[1],
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/printer')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Restaurant', async () => {
  const dto: CreateRestaurantDto = {
    ...CreateRestaurantData,
    defaultWorkingHours: supplier.defaultWorkingHours,
    overrideWorkingHours: supplier.overrideWorkingHours,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/restaurant')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Table Region', async () => {
  const dto: CreateListDto = {
    ...tableRegionData,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/list')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Table', async () => {
  const tableRegionRes = await request(app.getHttpServer())
    .get('/list')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(tableRegionRes.body).toBeDefined();
  expect(tableRegionRes.body).toHaveProperty('docs');
  expect(tableRegionRes.body).toHaveProperty('totalDocs');
  expect(tableRegionRes.body).toHaveProperty('limit');
  expect(tableRegionRes.body).toHaveProperty('page');
  expect(tableRegionRes.body).toHaveProperty('totalPages');
  expect(tableRegionRes.body).toHaveProperty('pagingCounter');
  expect(tableRegionRes.body).toHaveProperty('hasPrevPage');
  expect(tableRegionRes.body).toHaveProperty('hasNextPage');
  expect(tableRegionRes.body).toHaveProperty('prevPage');
  expect(tableRegionRes.body).toHaveProperty('nextPage');
  expect(tableRegionRes.statusCode).toBe(200);
  expect(tableRegionRes.body.docs.length > 0).toBe(true);

  const restaurantRes = await request(app.getHttpServer())
    .get('/restaurant')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(restaurantRes.body).toBeDefined();
  expect(restaurantRes.body).toHaveProperty('docs');
  expect(restaurantRes.body).toHaveProperty('totalDocs');
  expect(restaurantRes.body).toHaveProperty('limit');
  expect(restaurantRes.body).toHaveProperty('page');
  expect(restaurantRes.body).toHaveProperty('totalPages');
  expect(restaurantRes.body).toHaveProperty('pagingCounter');
  expect(restaurantRes.body).toHaveProperty('hasPrevPage');
  expect(restaurantRes.body).toHaveProperty('hasNextPage');
  expect(restaurantRes.body).toHaveProperty('prevPage');
  expect(restaurantRes.body).toHaveProperty('nextPage');
  expect(restaurantRes.statusCode).toBe(200);

  expect(restaurantRes.body.docs.length > 0).toBe(true);

  const dto: CreateTableDto = {
    ...tableData,
    tableRegionId: tableRegionRes.body.docs[0]._id,
    restaurantId: restaurantRes.body.docs[0]._id,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/table')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Kitchen Queue', async () => {
  const restaurantRes = await request(app.getHttpServer())
    .get('/restaurant')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(restaurantRes.body).toBeDefined();
  expect(restaurantRes.body).toHaveProperty('docs');
  expect(restaurantRes.body).toHaveProperty('totalDocs');
  expect(restaurantRes.body).toHaveProperty('limit');
  expect(restaurantRes.body).toHaveProperty('page');
  expect(restaurantRes.body).toHaveProperty('totalPages');
  expect(restaurantRes.body).toHaveProperty('pagingCounter');
  expect(restaurantRes.body).toHaveProperty('hasPrevPage');
  expect(restaurantRes.body).toHaveProperty('hasNextPage');
  expect(restaurantRes.body).toHaveProperty('prevPage');
  expect(restaurantRes.body).toHaveProperty('nextPage');
  expect(restaurantRes.statusCode).toBe(200);
  expect(restaurantRes.body.docs.length > 0).toBe(true);

  const dto: CreateKitchenQueueDto = {
    ...kitchenQueueData,

    restaurantId: restaurantRes.body.docs[0]._id,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/kitchen-queue')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Cashier', async () => {
  const restaurantRes = await request(app.getHttpServer())
    .get('/restaurant')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(restaurantRes.body).toBeDefined();
  expect(restaurantRes.body).toHaveProperty('docs');
  expect(restaurantRes.body).toHaveProperty('totalDocs');
  expect(restaurantRes.body).toHaveProperty('limit');
  expect(restaurantRes.body).toHaveProperty('page');
  expect(restaurantRes.body).toHaveProperty('totalPages');
  expect(restaurantRes.body).toHaveProperty('pagingCounter');
  expect(restaurantRes.body).toHaveProperty('hasPrevPage');
  expect(restaurantRes.body).toHaveProperty('hasNextPage');
  expect(restaurantRes.body).toHaveProperty('prevPage');
  expect(restaurantRes.body).toHaveProperty('nextPage');
  expect(restaurantRes.statusCode).toBe(200);
  expect(restaurantRes.body.docs.length > 0).toBe(true);

  const dto: CreateCashierDto = {
    ...CashierData,

    restaurantId: restaurantRes.body.docs[0]._id,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/cashier')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Payment Setup', async () => {
  const dto: CreatePaymentSetupDto = {
    ...PaymentSetupData,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/payment-setup')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Menu Category', async () => {
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/menu-category')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(MenuCategoryData);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Menu Item', async () => {
  const menuCategoryRes = await request(app.getHttpServer())
    .get('/menu-category')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(menuCategoryRes.body).toBeDefined();
  expect(menuCategoryRes.body).toHaveProperty('docs');
  expect(menuCategoryRes.body).toHaveProperty('totalDocs');
  expect(menuCategoryRes.body).toHaveProperty('limit');
  expect(menuCategoryRes.body).toHaveProperty('page');
  expect(menuCategoryRes.body).toHaveProperty('totalPages');
  expect(menuCategoryRes.body).toHaveProperty('pagingCounter');
  expect(menuCategoryRes.body).toHaveProperty('hasPrevPage');
  expect(menuCategoryRes.body).toHaveProperty('hasNextPage');
  expect(menuCategoryRes.body).toHaveProperty('prevPage');
  expect(menuCategoryRes.body).toHaveProperty('nextPage');
  expect(menuCategoryRes.statusCode).toBe(200);
  expect(menuCategoryRes.body.docs.length > 0).toBe(true);

  const dto: CreateMenuItemDTO = {
    ...MenuItemData,
    categoryId: menuCategoryRes.body.docs[0]._id,
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/menu-item')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Create Offers', async () => {
  const menuItemRes = await request(app.getHttpServer())
    .get('/menu-item')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(menuItemRes.body).toBeDefined();
  expect(menuItemRes.body).toHaveProperty('docs');
  expect(menuItemRes.body).toHaveProperty('totalDocs');
  expect(menuItemRes.body).toHaveProperty('limit');
  expect(menuItemRes.body).toHaveProperty('page');
  expect(menuItemRes.body).toHaveProperty('totalPages');
  expect(menuItemRes.body).toHaveProperty('pagingCounter');
  expect(menuItemRes.body).toHaveProperty('hasPrevPage');
  expect(menuItemRes.body).toHaveProperty('hasNextPage');
  expect(menuItemRes.body).toHaveProperty('prevPage');
  expect(menuItemRes.body).toHaveProperty('nextPage');
  expect(menuItemRes.statusCode).toBe(200);
  expect(menuItemRes.body.docs).toBeDefined();
  expect(menuItemRes.body.docs.length > 0).toBe(true);

  const dto: CreateOfferDto = {
    ...offers[0],
    menuItemIds: [menuItemRes.body.docs[0]._id],
  };

  const { body, statusCode } = await request(app.getHttpServer())
    .post('/offer')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});

it('Preview Order', async () => {
  const restaurantRes = await request(app.getHttpServer())
    .get('/restaurant')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(restaurantRes.body).toBeDefined();
  expect(restaurantRes.body).toHaveProperty('docs');
  expect(restaurantRes.body).toHaveProperty('totalDocs');
  expect(restaurantRes.body).toHaveProperty('limit');
  expect(restaurantRes.body).toHaveProperty('page');
  expect(restaurantRes.body).toHaveProperty('totalPages');
  expect(restaurantRes.body).toHaveProperty('pagingCounter');
  expect(restaurantRes.body).toHaveProperty('hasPrevPage');
  expect(restaurantRes.body).toHaveProperty('hasNextPage');
  expect(restaurantRes.body).toHaveProperty('prevPage');
  expect(restaurantRes.body).toHaveProperty('nextPage');
  expect(restaurantRes.statusCode).toBe(200);
  expect(restaurantRes.body.docs).toBeDefined();
  expect(restaurantRes.body.docs.length > 0).toBe(true);

  const tableRes = await request(app.getHttpServer())
    .get('/table')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send({ restaurantId: restaurantRes.body.docs[0]._id });
  expect(tableRes.body).toBeDefined();
  expect(tableRes.body).toHaveProperty('docs');
  expect(tableRes.body).toHaveProperty('totalDocs');
  expect(tableRes.body).toHaveProperty('limit');
  expect(tableRes.body).toHaveProperty('page');
  expect(tableRes.body).toHaveProperty('totalPages');
  expect(tableRes.body).toHaveProperty('pagingCounter');
  expect(tableRes.body).toHaveProperty('hasPrevPage');
  expect(tableRes.body).toHaveProperty('hasNextPage');
  expect(tableRes.body).toHaveProperty('prevPage');
  expect(tableRes.body).toHaveProperty('nextPage');
  expect(tableRes.statusCode).toBe(200);
  expect(tableRes.body.docs).toBeDefined();
  expect(tableRes.body.docs.length > 0).toBe(true);

  const menuItemRes = await request(app.getHttpServer())
    .get('/menu-item')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send();
  expect(menuItemRes.body).toBeDefined();
  expect(menuItemRes.body).toHaveProperty('docs');
  expect(menuItemRes.body).toHaveProperty('totalDocs');
  expect(menuItemRes.body).toHaveProperty('limit');
  expect(menuItemRes.body).toHaveProperty('page');
  expect(menuItemRes.body).toHaveProperty('totalPages');
  expect(menuItemRes.body).toHaveProperty('pagingCounter');
  expect(menuItemRes.body).toHaveProperty('hasPrevPage');
  expect(menuItemRes.body).toHaveProperty('hasNextPage');
  expect(menuItemRes.body).toHaveProperty('prevPage');
  expect(menuItemRes.body).toHaveProperty('nextPage');
  expect(menuItemRes.statusCode).toBe(200);
  expect(menuItemRes.body.docs).toBeDefined();
  expect(menuItemRes.body.docs.length > 0).toBe(true);

  const dto: CreateOrderDto = {
    restaurantId: restaurantRes.body.docs[0]._id,
    tableId: tableRes.body.docs[0]._id,
    source: Source.DineIn,
    name: 'Customer 1',
    contactNumber: '1234567890',
    orderType: OrderType.DineIn,
    items: [
      {
        menuItem: {
          menuItemId: menuItemRes.body.docs[0]._id,
        },
        quantity: 5,
        notes: 'Make it spicy',
      },
    ],
  };
  const { body, statusCode } = await request(app.getHttpServer())
    .post('/order')
    .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
    .send(dto);
  console.log(body);
  expect(statusCode).toBe(201);
});
describe('Test Dine-in order scenario', () => {
  it('Create Order', async () => {
    const restaurantRes = await request(app.getHttpServer())
      .get('/restaurant')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    expect(restaurantRes.body).toBeDefined();
    expect(restaurantRes.body).toHaveProperty('docs');
    expect(restaurantRes.body).toHaveProperty('totalDocs');
    expect(restaurantRes.body).toHaveProperty('limit');
    expect(restaurantRes.body).toHaveProperty('page');
    expect(restaurantRes.body).toHaveProperty('totalPages');
    expect(restaurantRes.body).toHaveProperty('pagingCounter');
    expect(restaurantRes.body).toHaveProperty('hasPrevPage');
    expect(restaurantRes.body).toHaveProperty('hasNextPage');
    expect(restaurantRes.body).toHaveProperty('prevPage');
    expect(restaurantRes.body).toHaveProperty('nextPage');
    expect(restaurantRes.statusCode).toBe(200);
    expect(restaurantRes.body.docs).toBeDefined();
    expect(restaurantRes.body.docs.length > 0).toBe(true);

    const tableRes = await request(app.getHttpServer())
      .get('/table')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({ restaurantId: restaurantRes.body.docs[0]._id });
    expect(tableRes.body).toBeDefined();
    expect(tableRes.body).toHaveProperty('docs');
    expect(tableRes.body).toHaveProperty('totalDocs');
    expect(tableRes.body).toHaveProperty('limit');
    expect(tableRes.body).toHaveProperty('page');
    expect(tableRes.body).toHaveProperty('totalPages');
    expect(tableRes.body).toHaveProperty('pagingCounter');
    expect(tableRes.body).toHaveProperty('hasPrevPage');
    expect(tableRes.body).toHaveProperty('hasNextPage');
    expect(tableRes.body).toHaveProperty('prevPage');
    expect(tableRes.body).toHaveProperty('nextPage');
    expect(tableRes.statusCode).toBe(200);
    expect(tableRes.body.docs).toBeDefined();
    expect(tableRes.body.docs.length > 0).toBe(true);

    const menuItemRes = await request(app.getHttpServer())
      .get('/menu-item')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    expect(menuItemRes.body).toBeDefined();
    expect(menuItemRes.body).toHaveProperty('docs');
    expect(menuItemRes.body).toHaveProperty('totalDocs');
    expect(menuItemRes.body).toHaveProperty('limit');
    expect(menuItemRes.body).toHaveProperty('page');
    expect(menuItemRes.body).toHaveProperty('totalPages');
    expect(menuItemRes.body).toHaveProperty('pagingCounter');
    expect(menuItemRes.body).toHaveProperty('hasPrevPage');
    expect(menuItemRes.body).toHaveProperty('hasNextPage');
    expect(menuItemRes.body).toHaveProperty('prevPage');
    expect(menuItemRes.body).toHaveProperty('nextPage');
    expect(menuItemRes.statusCode).toBe(200);
    expect(menuItemRes.body.docs).toBeDefined();
    expect(menuItemRes.body.docs.length > 0).toBe(true);

    const dto: CreateOrderDto = {
      restaurantId: restaurantRes.body.docs[0]._id,
      tableId: tableRes.body.docs[0]._id,
      source: Source.DineIn,
      name: 'Customer 1',
      contactNumber: '1234567890',
      orderType: OrderType.DineIn,
      items: [
        {
          menuItem: {
            menuItemId: menuItemRes.body.docs[0]._id,
          },
          quantity: 5,
          notes: 'Make it spicy',
        },
      ],
    };
    const { body, statusCode } = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send(dto);
    console.log(body);
    expect(statusCode).toBe(201);
    expect(body).toBeDefined();
    expect(body.summary.discount > 0).toBe(true);
  });

  it('Send To Kitchen', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        status: OrderStatus.New,
        paymentStatus: OrderPaymentStatus.NotPaid,
        type: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);

    const { body, statusCode } = await request(app.getHttpServer())
      .patch(`/order/${orderRes.body.docs[0]._id}/sent-to-kitchen`)
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    console.log(body);
    expect(body).toBeDefined();
    expect(statusCode).toBe(200);
    expect(body.status == OrderStatus.SentToKitchen).toBe(true);
    await delay(5000);
  });

  it('Check Kitchen Receipts', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        orderType: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);
    expect(orderRes.body.docs[0].kitchenReceipts.length > 0).toBe(true);
  });

  // kitchen queue process

  it('Take Cash Payment', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        status: OrderStatus.New,
        paymentStatus: OrderPaymentStatus.NotPaid,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);
    const dto: PaymentInitiateDto = {
      orderId: orderRes.body.docs[0]._id,
      paymentMethod: PaymentMethod.Cash,
    };
    const { body, statusCode } = await request(app.getHttpServer())
      .post('/payments/take-payment')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send(dto);

    console.log(body);
    expect(body).toBeDefined();
    expect(statusCode).toBe(201);
    await delay(5000);
  });

  it('Check Payment Status, Order Status and Invoice Status', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        orderType: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);
    expect(orderRes.body.docs[0].status == OrderStatus.Closed);
    expect(orderRes.body.docs[0].paymentStatus == OrderPaymentStatus.Paid);
    expect(orderRes.body.docs[0].invoiceStatus == InvoiceStatus.Invoiced);
  });
});

describe('Test Merge Orders', () => {
  it('Create Orders', async () => {
    const restaurantRes = await request(app.getHttpServer())
      .get('/restaurant')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    expect(restaurantRes.body).toBeDefined();
    expect(restaurantRes.body).toHaveProperty('docs');
    expect(restaurantRes.body).toHaveProperty('totalDocs');
    expect(restaurantRes.body).toHaveProperty('limit');
    expect(restaurantRes.body).toHaveProperty('page');
    expect(restaurantRes.body).toHaveProperty('totalPages');
    expect(restaurantRes.body).toHaveProperty('pagingCounter');
    expect(restaurantRes.body).toHaveProperty('hasPrevPage');
    expect(restaurantRes.body).toHaveProperty('hasNextPage');
    expect(restaurantRes.body).toHaveProperty('prevPage');
    expect(restaurantRes.body).toHaveProperty('nextPage');
    expect(restaurantRes.statusCode).toBe(200);
    expect(restaurantRes.body.docs).toBeDefined();
    expect(restaurantRes.body.docs.length > 0).toBe(true);

    const tableRes = await request(app.getHttpServer())
      .get('/table')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({ restaurantId: restaurantRes.body.docs[0]._id });
    expect(tableRes.body).toBeDefined();
    expect(tableRes.body).toHaveProperty('docs');
    expect(tableRes.body).toHaveProperty('totalDocs');
    expect(tableRes.body).toHaveProperty('limit');
    expect(tableRes.body).toHaveProperty('page');
    expect(tableRes.body).toHaveProperty('totalPages');
    expect(tableRes.body).toHaveProperty('pagingCounter');
    expect(tableRes.body).toHaveProperty('hasPrevPage');
    expect(tableRes.body).toHaveProperty('hasNextPage');
    expect(tableRes.body).toHaveProperty('prevPage');
    expect(tableRes.body).toHaveProperty('nextPage');
    expect(tableRes.statusCode).toBe(200);
    expect(tableRes.body.docs).toBeDefined();
    expect(tableRes.body.docs.length > 0).toBe(true);

    const menuItemRes = await request(app.getHttpServer())
      .get('/menu-item')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    expect(menuItemRes.body).toBeDefined();
    expect(menuItemRes.body).toHaveProperty('docs');
    expect(menuItemRes.body).toHaveProperty('totalDocs');
    expect(menuItemRes.body).toHaveProperty('limit');
    expect(menuItemRes.body).toHaveProperty('page');
    expect(menuItemRes.body).toHaveProperty('totalPages');
    expect(menuItemRes.body).toHaveProperty('pagingCounter');
    expect(menuItemRes.body).toHaveProperty('hasPrevPage');
    expect(menuItemRes.body).toHaveProperty('hasNextPage');
    expect(menuItemRes.body).toHaveProperty('prevPage');
    expect(menuItemRes.body).toHaveProperty('nextPage');
    expect(menuItemRes.statusCode).toBe(200);
    expect(menuItemRes.body.docs).toBeDefined();
    expect(menuItemRes.body.docs.length > 0).toBe(true);

    const dto: CreateOrderDto = {
      restaurantId: restaurantRes.body.docs[0]._id,
      tableId: tableRes.body.docs[0]._id,
      source: Source.DineIn,
      name: 'Customer 1',
      contactNumber: '1234567890',
      orderType: OrderType.DineIn,
      items: [
        {
          menuItem: {
            menuItemId: menuItemRes.body.docs[0]._id,
          },
          quantity: 5,
          notes: 'Make it spicy',
        },
      ],
    };
    const order1 = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send(dto);

    const order2 = await request(app.getHttpServer())
      .post('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send(dto);
    console.log(order1.body);
    expect(order1.statusCode).toBe(201);
    expect(order2.statusCode).toBe(201);
  });

  it('Send To Kitchen', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        status: OrderStatus.New,
        paymentStatus: OrderPaymentStatus.NotPaid,
        type: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);

    const { body, statusCode } = await request(app.getHttpServer())
      .patch(`/order/${orderRes.body.docs[0]._id}/sent-to-kitchen`)
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    console.log(body);
    expect(body).toBeDefined();
    expect(statusCode).toBe(200);
    expect(body.status == OrderStatus.SentToKitchen).toBe(true);
    await delay(3000);
  });

  it('Check Kitchen Receipts', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        orderType: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);
    expect(orderRes.body.docs[0].kitchenReceipts.length > 0).toBe(true);
  });

  // kitchen queue process

  it('Take Cash Payment', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        status: OrderStatus.New,
        paymentStatus: OrderPaymentStatus.NotPaid,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);
    const dto: PaymentInitiateDto = {
      orderId: orderRes.body.docs[0]._id,
      paymentMethod: PaymentMethod.Cash,
    };
    const { body, statusCode } = await request(app.getHttpServer())
      .post('/payments/take-payment')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send(dto);

    console.log(body);
    expect(body).toBeDefined();
    expect(statusCode).toBe(201);
    await delay(3000);
  });

  it('Check Payment Status, Order Status and Invoice Status', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        orderType: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);
    expect(orderRes.body.docs[0].status == OrderStatus.Closed);
    expect(orderRes.body.docs[0].paymentStatus == OrderPaymentStatus.Paid);
    expect(orderRes.body.docs[0].invoiceStatus == InvoiceStatus.Invoiced);
  });

  it('Merge Orders', async () => {
    const orderRes = await request(app.getHttpServer())
      .get('/order')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send({
        orderType: OrderType.DineIn,
      });
    expect(orderRes.body).toBeDefined();
    expect(orderRes.body).toHaveProperty('docs');
    expect(orderRes.body).toHaveProperty('totalDocs');
    expect(orderRes.body).toHaveProperty('limit');
    expect(orderRes.body).toHaveProperty('page');
    expect(orderRes.body).toHaveProperty('totalPages');
    expect(orderRes.body).toHaveProperty('pagingCounter');
    expect(orderRes.body).toHaveProperty('hasPrevPage');
    expect(orderRes.body).toHaveProperty('hasNextPage');
    expect(orderRes.body).toHaveProperty('prevPage');
    expect(orderRes.body).toHaveProperty('nextPage');
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.docs).toBeDefined();
    expect(orderRes.body.docs.length > 0).toBe(true);

    const dto: GroupOrderDto = {
      orderIds: orderRes.body.docs.map((o) => o._id),
    };
    const { body, statusCode } = await request(app.getHttpServer())
      .post('/order/group')
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send(dto);

    console.log(body);
    expect(body).toBeDefined();
    expect(statusCode).toBe(201);
    expect(
      body.summary.totalWithTax ==
        orderRes.body.docs[0].summary.totalWithTax +
          orderRes.body.docs[1].summary.totalWithTax,
    ).toBe(true);
    expect(orderRes.body.docs.map((o) => o.status).includes(body.status)).toBe(
      true,
    );

    await delay(2000);

    let singleOrderRes = await request(app.getHttpServer())
      .get('/order/' + dto.orderIds[0])
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    expect(singleOrderRes.statusCode).toBe(200);
    expect(singleOrderRes.body).toBeDefined();
    expect(singleOrderRes.body.status == OrderStatus.CancelledByMerge);

    singleOrderRes = await request(app.getHttpServer())
      .get('/order/' + dto.orderIds[1])
      .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
      .send();
    expect(singleOrderRes.statusCode).toBe(200);
    expect(singleOrderRes.body).toBeDefined();
    expect(singleOrderRes.body.status == OrderStatus.CancelledByMerge).toBe(
      true,
    );
  });
});

// describe('Test Delivery order scenario', () => {
//   it('Create Order', async () => {
//     const restaurantRes = await request(app.getHttpServer())
//       .get('/restaurant')
//       .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//       .send();
//     expect(restaurantRes.body).toBeDefined();
//     expect(restaurantRes.body).toHaveProperty('docs');
//     expect(restaurantRes.body).toHaveProperty('totalDocs');
//     expect(restaurantRes.body).toHaveProperty('limit');
//     expect(restaurantRes.body).toHaveProperty('page');
//     expect(restaurantRes.body).toHaveProperty('totalPages');
//     expect(restaurantRes.body).toHaveProperty('pagingCounter');
//     expect(restaurantRes.body).toHaveProperty('hasPrevPage');
//     expect(restaurantRes.body).toHaveProperty('hasNextPage');
//     expect(restaurantRes.body).toHaveProperty('prevPage');
//     expect(restaurantRes.body).toHaveProperty('nextPage');
//     expect(restaurantRes.statusCode).toBe(200);
//     expect(restaurantRes.body.docs).toBeDefined();
//     expect(restaurantRes.body.docs.length > 0).toBe(true);

//     const menuItemRes = await request(app.getHttpServer())
//       .get('/menu-item')
//       .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//       .send();
//     expect(menuItemRes.body).toBeDefined();
//     expect(menuItemRes.body).toHaveProperty('docs');
//     expect(menuItemRes.body).toHaveProperty('totalDocs');
//     expect(menuItemRes.body).toHaveProperty('limit');
//     expect(menuItemRes.body).toHaveProperty('page');
//     expect(menuItemRes.body).toHaveProperty('totalPages');
//     expect(menuItemRes.body).toHaveProperty('pagingCounter');
//     expect(menuItemRes.body).toHaveProperty('hasPrevPage');
//     expect(menuItemRes.body).toHaveProperty('hasNextPage');
//     expect(menuItemRes.body).toHaveProperty('prevPage');
//     expect(menuItemRes.body).toHaveProperty('nextPage');
//     expect(menuItemRes.statusCode).toBe(200);
//     expect(menuItemRes.body.docs).toBeDefined();
//     expect(menuItemRes.body.docs.length > 0).toBe(true);

//     const dto: CreateOrderDto = {
//       restaurantId: restaurantRes.body.docs[0]._id,

//       source: Source.App,
//       name: 'Customer 1',
//       contactNumber: '1234567890',
//       orderType: OrderType.Delivery,
//       items: [
//         {
//           menuItem: {
//             menuItemId: menuItemRes.body.docs[0]._id,
//           },
//           quantity: 5,
//           notes: 'Make it spicy',
//         },
//       ],
//       deliveryAddress: {
//         address: 'Test address',
//         city: 'Test address',
//         state: 'Test address',
//         district: 'Test address',
//         zipCode: 123456,
//       },
//     };
//     const { body, statusCode } = await request(app.getHttpServer())
//       .post('/order')
//       .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//       .send(dto);
//     console.log(body);
//     expect(statusCode).toBe(201);
//   });

//   it('Take Cash Payment', async () => {
//     const orderRes = await request(app.getHttpServer())
//       .get('/order')
//       .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//       .send({
//         status: OrderStatus.New,
//         paymentStatus: OrderPaymentStatus.NotPaid,
//         orderType: OrderType.Delivery,
//       });
//     expect(orderRes.body).toBeDefined();
//     expect(orderRes.body).toHaveProperty('docs');
//     expect(orderRes.body).toHaveProperty('totalDocs');
//     expect(orderRes.body).toHaveProperty('limit');
//     expect(orderRes.body).toHaveProperty('page');
//     expect(orderRes.body).toHaveProperty('totalPages');
//     expect(orderRes.body).toHaveProperty('pagingCounter');
//     expect(orderRes.body).toHaveProperty('hasPrevPage');
//     expect(orderRes.body).toHaveProperty('hasNextPage');
//     expect(orderRes.body).toHaveProperty('prevPage');
//     expect(orderRes.body).toHaveProperty('nextPage');
//     expect(orderRes.statusCode).toBe(200);
//     expect(orderRes.body.docs).toBeDefined();
//     expect(orderRes.body.docs.length > 0).toBe(true);
//     const dto: PaymentInitiateDto = {
//       orderId: orderRes.body.docs[0]._id,
//       paymentMethod: PaymentMethod.Cash,
//     };
//     const { body, statusCode } = await request(app.getHttpServer())
//       .post('/payments/take-payment')
//       .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//       .send(dto);

//     console.log(body);
//     expect(body).toBeDefined();
//     expect(statusCode).toBe(201);
//     await delay(5000);
//   }, 6000);

//   // it('Check Kitchen Receipts', async () => {
//   //   const orderRes = await request(app.getHttpServer())
//   //     .get('/order')
//   //     .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//   //     .send();
//   //   console.log(orderRes);
//   //   expect(orderRes.body).toBeDefined();
//   //   expect(orderRes.body).toHaveProperty('docs');
//   //   expect(orderRes.body).toHaveProperty('totalDocs');
//   //   expect(orderRes.body).toHaveProperty('limit');
//   //   expect(orderRes.body).toHaveProperty('page');
//   //   expect(orderRes.body).toHaveProperty('totalPages');
//   //   expect(orderRes.body).toHaveProperty('pagingCounter');
//   //   expect(orderRes.body).toHaveProperty('hasPrevPage');
//   //   expect(orderRes.body).toHaveProperty('hasNextPage');
//   //   expect(orderRes.body).toHaveProperty('prevPage');
//   //   expect(orderRes.body).toHaveProperty('nextPage');
//   //   expect(orderRes.statusCode).toBe(200);
//   //   expect(orderRes.body.docs).toBeDefined();
//   //   expect(orderRes.body.docs.length > 0).toBe(true);
//   //   expect(orderRes.body.docs[0].kitchenReceipts.length > 0).toBe(true);
//   // });

//   // it('Check Payment Status, Order Status and Invoice Status', async () => {
//   //   const orderRes = await request(app.getHttpServer())
//   //     .get('/order')
//   //     .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//   //     .send({
//   //       orderType: OrderType.Delivery,
//   //     });
//   //   expect(orderRes.body).toBeDefined();
//   //   expect(orderRes.body).toHaveProperty('docs');
//   //   expect(orderRes.body).toHaveProperty('totalDocs');
//   //   expect(orderRes.body).toHaveProperty('limit');
//   //   expect(orderRes.body).toHaveProperty('page');
//   //   expect(orderRes.body).toHaveProperty('totalPages');
//   //   expect(orderRes.body).toHaveProperty('pagingCounter');
//   //   expect(orderRes.body).toHaveProperty('hasPrevPage');
//   //   expect(orderRes.body).toHaveProperty('hasNextPage');
//   //   expect(orderRes.body).toHaveProperty('prevPage');
//   //   expect(orderRes.body).toHaveProperty('nextPage');
//   //   expect(orderRes.statusCode).toBe(200);
//   //   expect(orderRes.body.docs).toBeDefined();
//   //   expect(orderRes.body.docs.length > 0).toBe(true);
//   //   expect(orderRes.body.docs[0].status == OrderStatus.SentToKitchen);
//   //   expect(orderRes.body.docs[0].paymentStatus == OrderPaymentStatus.Paid);
//   //   expect(orderRes.body.docs[0].invoiceStatus == InvoiceStatus.Invoiced);
//   // }, 10000);

//   // it('Close Order', async () => {
//   //   const orderRes = await request(app.getHttpServer())
//   //     .get('/order')
//   //     .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//   //     .send({
//   //       orderType: OrderType.Delivery,
//   //       paymentStatus: OrderPaymentStatus.Paid,
//   //     });
//   //   expect(orderRes.body).toBeDefined();
//   //   expect(orderRes.body).toHaveProperty('docs');
//   //   expect(orderRes.body).toHaveProperty('totalDocs');
//   //   expect(orderRes.body).toHaveProperty('limit');
//   //   expect(orderRes.body).toHaveProperty('page');
//   //   expect(orderRes.body).toHaveProperty('totalPages');
//   //   expect(orderRes.body).toHaveProperty('pagingCounter');
//   //   expect(orderRes.body).toHaveProperty('hasPrevPage');
//   //   expect(orderRes.body).toHaveProperty('hasNextPage');
//   //   expect(orderRes.body).toHaveProperty('prevPage');
//   //   expect(orderRes.body).toHaveProperty('nextPage');
//   //   expect(orderRes.statusCode).toBe(200);
//   //   expect(orderRes.body.docs).toBeDefined();
//   //   expect(orderRes.body.docs.length > 0).toBe(true);

//   //   const { body, statusCode } = await request(app.getHttpServer())
//   //     .patch(`/order/${orderRes.body.docs[0]._id}`)
//   //     .set('Authorization', 'Bearer ' + supplierAdmin.accessToken)
//   //     .send({
//   //       status: OrderStatus.Closed,
//   //     });
//   //   console.log(body);
//   //   expect(body).toBeDefined();
//   //   expect(statusCode).toBe(200);
//   //   expect(body.status == OrderStatus.Closed).toBe(true);
//   // }, 10000);
// });

async function delay(t) {
  return new Promise((resolve) => setTimeout(resolve, t));
}
