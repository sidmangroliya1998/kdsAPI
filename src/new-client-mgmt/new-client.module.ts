import { Module } from '@nestjs/common';
import { NewClientManagementService } from './new-client.service';
import { NewClientManagementController } from './new-client.controller';
import { ProfitLossModule } from 'src/profit-loss-cal/profit-loss.module';
import { BalanceSheetModule } from 'src/balance-sheet-cal/balance-sheet.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from 'src/expense/schemas/expense.schema';
import { GlVoucher, GlVoucherSchema } from 'src/accounting/schemas/gl-voucher.schema';
import { AssetAquDep, AssetAquDepSchema } from 'src/asset-management/asset-aqu/schemas/asset-aqu-dep.schema';
import { AssetAquTrans, AssetAquTransSchema } from 'src/asset-management/asset-aqu/schemas/asset-aqu-transaction.schema';
import { AssetAqu, AssetAquSchema } from 'src/asset-management/asset-aqu/schemas/asset-aqu.schema';
import { AssetRetirement, AssetRetirementSchema } from 'src/asset-management/asset-aqu/schemas/asset-retirement.schema';
import { GlAccountGroup, GlAccountGroupSchema } from 'src/gl-account-group/schemas/gl-account-group.schema';
import { GlAccountMapping, GlAccountMappingSchema } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { GlAccountSet, GlAccountSetSchema } from 'src/gl-account-set/schemas/gl-account-set.schema';
import { GlAccount, GlAccountSchema } from 'src/gl-account/schemas/gl-account.schema';
import { GoodsReceipt, GoodsReceiptSchema } from 'src/goods-receipt/schemas/goods-receipt.schema';
import { InventoryHistory, InventoryHistorySchema } from 'src/inventory/schemas/inventory-history.schema';
import { InventoryTransfer, InventoryTransferSchema } from 'src/inventory/schemas/inventory-transfer.schema';
import { Inventory, InventorySchema } from 'src/inventory/schemas/inventory.schema';
import { InvoiceReceipt, InvoiceReceiptSchema } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { ManualCustomerInvoice, ManualCustomerInvoiceSchema } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import { ManualCustomerPayment, ManualCustomerPaymentSchema } from 'src/manual-customer-payment/schemas/manual-customer-payment.schema';
import { ManualVendorInvoice, ManualVendorInvoiceSchema } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualVendorPayment, ManualVendorPaymentSchema } from 'src/manual-vendor-payment/schemas/manual-vendor-payment.schema';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import { ProductionEvent, ProductionEventSchema } from 'src/production-event/schema/production-event.schema';
import { PurchaseOrder, PurchaseOrderSchema } from 'src/purchase-order/schemas/purchase-order.schema';
import { Purchase, PurchaseSchema } from 'src/purchase/schemas/purchase.schema';
import { WasteEvent, WasteEventSchema } from 'src/waste-event/schema/waste-event.schema';
import { PrimeCostModule } from 'src/prime-cost-cal/prime-cost.module';
import { NewClientHelperService } from './new-client-helper.service';
import { MenuItem, MenuItemSchema } from 'src/menu/schemas/menu-item.schema';
import { Material, MaterialSchema } from 'src/material/schemas/material.schema';
import { UnitOfMeasure, UnitOfMeasureSchema } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { PurchaseOrderModule } from 'src/purchase-order/purchase-order.module';
import { Vendor, VendorSchema } from 'src/vendor/schemas/vendor.schema';
import { PurchaseCategory, PurchaseCategorySchema } from 'src/purchase-category/schemas/purchase-category.schema';
import { MenuCategory, MenuCategorySchema } from 'src/menu/schemas/menu-category.schema';
import { PurchaseModule } from 'src/purchase/purchase.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { ProductionEventModule } from 'src/production-event/production-event.module';
import { List, ListSchema } from 'src/list/schemas/list.schema';
import { ManualVendorInvoiceModule } from 'src/manual-vendor-invoice/manual-vendor-invoice.module';
import { ManualCustomerInvoiceModule } from 'src/manual-customer-invoice/manual-customer-invoice.module';
import { Customer, CustomerSchema } from 'src/customer/schemas/customer.schema';
import { WasteEventModule } from 'src/waste-event/waste-event.module';
import { AssetCategory, AssetCategorySchema } from 'src/asset-management/asset-categories/schemas/asset-cat.schema';
import { AssetAquModule } from 'src/asset-management/asset-aqu/asset-aqu.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Expense.name, schema: ExpenseSchema },
            { name: Purchase.name, schema: PurchaseSchema },
            { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
            { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
            { name: InvoiceReceipt.name, schema: InvoiceReceiptSchema },
            { name: ProductionEvent.name, schema: ProductionEventSchema },
            { name: WasteEvent.name, schema: WasteEventSchema },
            { name: InventoryTransfer.name, schema: InventoryTransferSchema },
            { name: Inventory.name, schema: InventorySchema },
            { name: InventoryHistory.name, schema: InventoryHistorySchema },
            { name: ManualVendorInvoice.name, schema: ManualVendorInvoiceSchema },
            { name: ManualVendorPayment.name, schema: ManualVendorPaymentSchema },
            { name: ManualCustomerPayment.name, schema: ManualCustomerPaymentSchema },
            { name: ManualCustomerInvoice.name, schema: ManualCustomerInvoiceSchema },
            { name: AssetAqu.name, schema: AssetAquSchema },
            { name: AssetAquTrans.name, schema: AssetAquTransSchema },
            { name: AssetAquDep.name, schema: AssetAquDepSchema },
            { name: AssetRetirement.name, schema: AssetRetirementSchema },
            { name: Order.name, schema: OrderSchema },
            { name: GlVoucher.name, schema: GlVoucherSchema },
            { name: GlAccountGroup.name, schema: GlAccountGroupSchema },
            { name: GlAccount.name, schema: GlAccountSchema },
            { name: GlAccountSet.name, schema: GlAccountSetSchema },
            { name: GlAccountMapping.name, schema: GlAccountMappingSchema },
            { name: MenuItem.name, schema: MenuItemSchema },
            { name: Material.name, schema: MaterialSchema },
            { name: UnitOfMeasure.name, schema: UnitOfMeasureSchema },
            { name: Vendor.name, schema: VendorSchema },
            { name: PurchaseCategory.name, schema: PurchaseCategorySchema },
            { name: MenuCategory.name, schema: MenuCategorySchema },
            { name: List.name, schema: ListSchema },
            { name: Customer.name, schema: CustomerSchema },
            { name: AssetCategory.name, schema: AssetCategorySchema }
        ]
        ),
        ProfitLossModule,
        BalanceSheetModule,
        PrimeCostModule,
        PurchaseOrderModule,
        PurchaseModule,
        ExpenseModule,
        ProductionEventModule,
        ManualVendorInvoiceModule,
        ManualCustomerInvoiceModule,
        WasteEventModule,
        AssetAquModule
    ],
    controllers: [NewClientManagementController],
    providers: [NewClientManagementService, NewClientHelperService],
    exports: [NewClientManagementService, NewClientHelperService]
})
export class NewClientModule { }
