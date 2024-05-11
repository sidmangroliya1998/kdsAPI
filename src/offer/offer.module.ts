import { Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { Offer, OfferSchema } from './schemas/offer.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionService } from 'src/permission/permission.service';
import { Role, RoleSchema } from 'src/role/schemas/roles.schema';
import { SupplierPackage, SupplierPackageSchema } from 'src/supplier/schemas/supplier-package.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Role.name, schema: RoleSchema },
      { name: SupplierPackage.name, schema: SupplierPackageSchema },
    ]),
  ],
  controllers: [OfferController],
  providers: [
    OfferService,
    PermissionService
  ],
  exports: [OfferService],
})
export class OfferModule {}
