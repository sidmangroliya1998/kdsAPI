import { Module, forwardRef } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './schemas/purchase-order.schema';
import { Material, MaterialSchema } from 'src/material/schemas/material.schema';
import {
  RestaurantMaterial,
  RestaurantMaterialSchema,
} from 'src/material/schemas/restaurant-material.schema';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import {
  Restaurant,
  RestaurantSchema,
} from 'src/restaurant/schemas/restaurant.schema';
import { Vendor, VendorSchema } from 'src/vendor/schemas/vendor.schema';
import {
  UnitOfMeasure,
  UnitOfMeasureSchema,
} from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { PurchaseOrderHelperService } from './purchase-order-helper.service';
import {
  SelectedVendor,
  SelectedVendorSchema,
} from 'src/selected-vendor/schema/selected-vendor.schema';
import {
  Supplier,
  SupplierSchema,
} from 'src/supplier/schemas/suppliers.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptSchema,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import {
  GoodsReceipt,
  GoodsReceiptSchema,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import { GoodsReceiptModule } from 'src/goods-receipt/goods-receipt.module';
import { InvoiceReceiptModule } from 'src/invoice-receipt/invoice-receipt.module';
import { ManualVendorPaymentModule } from 'src/manual-vendor-payment/manual-vendor-payment.module';
import { GlAccountMapping, GlAccountMappingSchema } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { Inventory, InventorySchema } from 'src/inventory/schemas/inventory.schema';
import { MaxCeilingPrice, MaxCeilingPriceSchema } from './schemas/max-ceiling.schema';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema },
      { name: SelectedVendor.name, schema: SelectedVendorSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
      { name: GlAccountMapping.name, schema: GlAccountMappingSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: MaxCeilingPrice.name, schema: MaxCeilingPriceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UnitOfMeasureModule,
    forwardRef(() => GoodsReceiptModule),
    InvoiceReceiptModule,
    ManualVendorPaymentModule
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PurchaseOrderHelperService],
  exports: [PurchaseOrderHelperService, PurchaseOrderService],
})
export class PurchaseOrderModule { }
