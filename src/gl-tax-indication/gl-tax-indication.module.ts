import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlTaxIndication, GlTaxIndicationSchema } from './schemas/gl-tax-indication.schema';
import { GlTaxIndicationService } from './gl-tax-indication.service';
import { GlTaxIndicationController } from './gl-tax-indication.controller';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GlTaxIndication.name, schema: GlTaxIndicationSchema },
        ]),
    ],
    controllers: [GlTaxIndicationController],
    providers: [GlTaxIndicationService],
    exports: [GlTaxIndicationService]
})
export class GlTaxIndicationModule { }
