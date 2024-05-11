import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpeningBalController } from './opening-bal.controller';
import { OpeningBalService } from './opening-bal.service';
import { OpeningBal, OpeningBalSchema } from './schemas/opening-bal.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { GlAccount, GlAccountSchema } from 'src/gl-account/schemas/gl-account.schema';
import { GlAccountModule } from 'src/gl-account/gl-account.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: OpeningBal.name, schema: OpeningBalSchema },
            { name: GlAccount.name, schema: GlAccountSchema },
        ]),
        AccountingModule,
        GlAccountModule
    ],
    controllers: [OpeningBalController],
    providers: [OpeningBalService],
    exports: [OpeningBalService]
})
export class OpeningBalModule { }

