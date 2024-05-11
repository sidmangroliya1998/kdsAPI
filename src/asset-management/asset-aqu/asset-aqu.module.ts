import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { AssetAquService } from './asset-aqu.service';
import { AssetAqu, AssetAquSchema } from './schemas/asset-aqu.schema';
import { AssetAquController } from './asset-aqu.controller';
import { AssetAquDep, AssetAquDepSchema } from './schemas/asset-aqu-dep.schema';
import { AssetAquTrans, AssetAquTransSchema } from './schemas/asset-aqu-transaction.schema';
import { AccountingModule } from 'src/accounting/accounting.module';
import { AssetRetirement, AssetRetirementSchema } from './schemas/asset-retirement.schema';
import { Sequence, SequenceSchema } from 'src/sequence/schemas/sequence.schema';
import { SequenceService } from 'src/sequence/sequence.service';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AssetAqu.name, schema: AssetAquSchema },
            { name: AssetAquDep.name, schema: AssetAquDepSchema },
            { name: AssetAquTrans.name, schema: AssetAquTransSchema },
            { name: AssetRetirement.name, schema: AssetRetirementSchema },
            { name: Sequence.name, schema: SequenceSchema },
        ]),
        AccountingModule
    ],
    controllers: [AssetAquController],
    providers: [AssetAquService, SequenceService],
    exports: [AssetAquService]
})
export class AssetAquModule { }
