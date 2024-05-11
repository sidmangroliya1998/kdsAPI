import { Module } from '@nestjs/common';
import { GlAccountService } from './gl-account.service';
import { GlAccountController } from './gl-account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GlAccount, GlAccountSchema } from './schemas/gl-account.schema';
import { GlAccountBalance, GlAccountBalanceSchema } from './schemas/gl-account-balance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlAccount.name, schema: GlAccountSchema },
      { name: GlAccountBalance.name, schema: GlAccountBalanceSchema },
    ]),
  ],
  controllers: [GlAccountController],
  providers: [GlAccountService],
  exports:[GlAccountService]
})
export class GlAccountModule {}
