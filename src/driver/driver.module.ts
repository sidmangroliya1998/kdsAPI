import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schema/driver.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';

@Module({
  controllers: [DriverController],
  providers: [DriverService],
  imports: [
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
})
export class DriverModule {}
