import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { Role, RoleSchema } from 'src/role/schemas/roles.schema';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import { Sequence, SequenceSchema } from 'src/sequence/schemas/sequence.schema';
import { SequenceService } from 'src/sequence/sequence.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Sequence.name, schema: SequenceSchema },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService,SequenceService],
  exports: [CustomerService],
})
export class CustomerModule {}
