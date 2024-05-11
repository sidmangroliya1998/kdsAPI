import { Module, forwardRef } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { GlVoucherService } from './gl-voucher.service';
import { GlVoucherController } from './gl-voucher.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GlAccount,
  GlAccountSchema,
} from 'src/gl-account/schemas/gl-account.schema';
import { GlVoucher, GlVoucherSchema } from './schemas/gl-voucher.schema';
import { GlVoucherHelperService } from './gl-voucher-helper.service';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import { Purchase, PurchaseSchema } from 'src/purchase/schemas/purchase.schema';
import { Expense, ExpenseSchema } from 'src/expense/schemas/expense.schema';
import {
  GlAccountMapping,
  GlAccountMappingSchema,
} from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/schemas/transactions.schema';
import {
  InventoryHistory,
  InventoryHistorySchema,
} from 'src/inventory/schemas/inventory-history.schema';
import {
  GoodsReceipt,
  GoodsReceiptSchema,
} from 'src/goods-receipt/schemas/goods-receipt.schema';
import {
  InvoiceReceipt,
  InvoiceReceiptSchema,
} from 'src/invoice-receipt/schema/invoice-receipt.schema';
import {
  WasteEvent,
  WasteEventSchema,
} from 'src/waste-event/schema/waste-event.schema';
import {
  InventoryTransfer,
  InventoryTransferSchema,
} from 'src/inventory/schemas/inventory-transfer.schema';
import {
  ProductionEvent,
  ProductionEventSchema,
} from 'src/production-event/schema/production-event.schema';
import { OrderModule } from 'src/order/order.module';
import {
  InventoryCount,
  InventoryCountSchema,
} from 'src/inventory-count/schema/inventory-count.schema';
import {
  ManualCustomerInvoice,
  ManualCustomerInvoiceSchema,
} from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import {
  ManualCustomerPayment,
  ManualCustomerPaymentSchema,
} from 'src/manual-customer-payment/schemas/manual-customer-payment.schema';
import {
  ManualVendorInvoice,
  ManualVendorInvoiceSchema,
} from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import {
  ManualVendorPayment,
  ManualVendorPaymentSchema,
} from 'src/manual-vendor-payment/schemas/manual-vendor-payment.schema';
import {
  ProfitDetail,
  ProfitDetailSchema,
} from 'src/profit-detail/schema/profit-detail.schema';
import { OpeningBal, OpeningBalSchema } from 'src/opening-bal/schemas/opening-bal.schema';
import { EmpTimeSheet, EmpTimeSheetSchema } from 'src/employee-mgmt/schemas/emp-hourly-timesheet.schema';
import { Emp, EmpSchema } from 'src/employee-mgmt/schemas/emp.schema';
import { PaymentFees, PaymentFeesSchema } from 'src/payment-setup/schemas/payment-fees.schema';
import { AssetAquDep, AssetAquDepSchema } from 'src/asset-management/asset-aqu/schemas/asset-aqu-dep.schema';
import { AssetAquTrans, AssetAquTransSchema } from 'src/asset-management/asset-aqu/schemas/asset-aqu-transaction.schema';
import { AssetRetirement, AssetRetirementSchema } from 'src/asset-management/asset-aqu/schemas/asset-retirement.schema';
import { GlAccountBalance, GlAccountBalanceSchema } from 'src/gl-account/schemas/gl-account-balance.schema';
import { RestaurantMaterial, RestaurantMaterialSchema } from 'src/material/schemas/restaurant-material.schema';
import { UnitOfMeasureModule } from 'src/unit-of-measure/unit-of-measure.module';
import { GlTaxIndication, GlTaxIndicationSchema } from 'src/gl-tax-indication/schemas/gl-tax-indication.schema';
import { GlVoucherHistory, GlVoucherHistorySchema } from './schemas/gl-voucher-history.schema';
import { GlVoucherRecurring, GlVoucherRecurringSchema } from './schemas/gl-voucher-recurring.schema';
import { GlVoucherRecurringService } from './gl-voucher-recurring.service';
import { User, UserSchema } from 'src/users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlVoucher.name, schema: GlVoucherSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: GlAccountMapping.name, schema: GlAccountMappingSchema },
      { name: GlAccount.name, schema: GlAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
      { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
      { name: WasteEvent.name, schema: WasteEventSchema },
      { name: InventoryTransfer.name, schema: InventoryTransferSchema },
      { name: ProductionEvent.name, schema: ProductionEventSchema },
      { name: InventoryHistory.name, schema: InventoryHistorySchema },
      { name: InventoryCount.name, schema: InventoryCountSchema },
      { name: ProfitDetail.name, schema: ProfitDetailSchema },
      { name: ManualVendorInvoice.name, schema: ManualVendorInvoiceSchema },
      { name: ManualVendorPayment.name, schema: ManualVendorPaymentSchema },
      { name: ManualCustomerInvoice.name, schema: ManualCustomerInvoiceSchema },
      { name: ManualCustomerPayment.name, schema: ManualCustomerPaymentSchema },
      { name: OpeningBal.name, schema: OpeningBalSchema },
      { name: EmpTimeSheet.name, schema: EmpTimeSheetSchema },
      { name: Emp.name, schema: EmpSchema },
      { name: PaymentFees.name, schema: PaymentFeesSchema },
      { name: AssetAquDep.name, schema: AssetAquDepSchema },
      { name: AssetAquTrans.name, schema: AssetAquTransSchema },
      {
        name: AssetRetirement.name, schema: AssetRetirementSchema
      },
      { name: GlAccountBalance.name, schema: GlAccountBalanceSchema },
      { name: RestaurantMaterial.name, schema: RestaurantMaterialSchema },
      { name: GlTaxIndication.name, schema: GlTaxIndicationSchema },
      { name: GlVoucherHistory.name, schema: GlVoucherHistorySchema },
      { name: GlVoucherRecurring.name, schema: GlVoucherRecurringSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => OrderModule),
    UnitOfMeasureModule
  ],
  controllers: [AccountingController, GlVoucherController],
  providers: [AccountingService, GlVoucherService, GlVoucherHelperService, GlVoucherRecurringService],
  exports: [GlVoucherHelperService],
})
export class AccountingModule { }
