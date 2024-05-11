import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlRevenueCode, GlRevenueCodeSchema } from './schemas/gl-revenue-code.schema';
import { GlRevenueCodeController } from './gl-revenue-code.controller';
import { GlRevenueCodeService } from './gl-revenue-code.service';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GlRevenueCode.name, schema: GlRevenueCodeSchema },
        ]),
    ],
    controllers: [GlRevenueCodeController],
    providers: [GlRevenueCodeService],
    exports: [GlRevenueCodeService]
})
export class GlRevenueCodeModule { }
