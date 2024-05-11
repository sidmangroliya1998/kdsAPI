import { Module } from '@nestjs/common';
import { ListService } from './list.service';
import { ListController } from './list.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { List, ListSchema } from './schemas/list.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: List.name, schema: ListSchema },
    { name: User.name, schema: UserSchema },]),
  ],
  controllers: [ListController],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule { }
