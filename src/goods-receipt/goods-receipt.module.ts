import { Module,forwardRef } from '@nestjs/common';
import { GoodsReceiptService } from './goods-receipt.service';
import { GoodsReceiptController } from './goods-receipt.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GoodsReceipt,
  GoodsReceiptSchema,
} from './schemas/goods-receipt.schema';
import { InventoryModule } from 'src/inventory/inventory.module';
import { GoodsReceiptHelperService } from './goods-receipt-helper.service';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from 'src/purchase-order/schemas/purchase-order.schema';
import { PurchaseOrderModule } from 'src/purchase-order/purchase-order.module';
import { AccountingModule } from 'src/accounting/accounting.module';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    InventoryModule,
    forwardRef(() => PurchaseOrderModule),
    AccountingModule,
  ],
  controllers: [GoodsReceiptController],
  providers: [GoodsReceiptService, GoodsReceiptHelperService],
  exports:[GoodsReceiptService]
})
export class GoodsReceiptModule {}
