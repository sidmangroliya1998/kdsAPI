import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeleteProcessDto } from './dto/create-delete-client.dto';
import { Expense, ExpenseDocument } from 'src/expense/schemas/expense.schema';
import mongoose, { Model } from 'mongoose';
import { Purchase, PurchaseDocument } from 'src/purchase/schemas/purchase.schema';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { GoodsReceipt, GoodsReceiptDocument } from 'src/goods-receipt/schemas/goods-receipt.schema';
import { InvoiceReceipt, InvoiceReceiptDocument } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { ProductionEvent, ProductionEventDocument } from 'src/production-event/schema/production-event.schema';
import { WasteEvent, WasteEventDocument } from 'src/waste-event/schema/waste-event.schema';
import { InventoryTransfer, InventoryTransferDocument } from 'src/inventory/schemas/inventory-transfer.schema';
import { InventoryHistory, InventoryHistoryDocument } from 'src/inventory/schemas/inventory-history.schema';
import { Inventory, InventoryDocument } from 'src/inventory/schemas/inventory.schema';
import { ManualVendorInvoice, ManualVendorInvoiceDocument } from 'src/manual-vendor-invoice/schemas/manual-vendor-invoice.schema';
import { ManualVendorPayment, ManualVendorPaymentDocument } from 'src/manual-vendor-payment/schemas/manual-vendor-payment.schema';
import { ManualCustomerPayment, ManualCustomerPaymentDocument } from 'src/manual-customer-payment/schemas/manual-customer-payment.schema';
import { ManualCustomerInvoice, ManualCustomerInvoiceDocument } from 'src/manual-customer-invoice/schemas/manual-customer-invoice.schema';
import { AssetAqu, AssetAquDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu.schema';
import { AssetAquTrans, AssetAquTransDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu-transaction.schema';
import { AssetAquDep, AssetAquDepDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu-dep.schema';
import { AssetRetirement, AssetRetirementDocument } from 'src/asset-management/asset-aqu/schemas/asset-retirement.schema';
import { Order, OrderDocument } from 'src/order/schemas/order.schema';
import { GlVoucher, GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccountSet, GlAccountSetDocument } from 'src/gl-account-set/schemas/gl-account-set.schema';
import { GlAccount, GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { GlAccountGroup, GlAccountGroupDocument } from 'src/gl-account-group/schemas/gl-account-group.schema';
import { GlAccountMapping, GlAccountMappingDocument } from 'src/gl-account-mapping/schemas/gl-account-mapping.schema';
import { PrimeCostService } from 'src/prime-cost-cal/prime-cost.service';
import { ProfitLossService } from 'src/profit-loss-cal/profit-loss.service';
import { BalanceSheetService } from 'src/balance-sheet-cal/balance-sheet.service';
import { ImportProcessDto } from './dto/import-process.dto';
import { BulkImportType } from './enum/bulk-import.enum';
import { NewClientHelperService } from './new-client-helper.service';
import { UnitOfMeasure, UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { Vendor, VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { Material, MaterialDocument } from 'src/material/schemas/material.schema';
import { PurchaseCategory, PurchaseCategoryDocument } from 'src/purchase-category/schemas/purchase-category.schema';
import { MenuCategory, MenuCategoryDocument } from 'src/menu/schemas/menu-category.schema';
import { List, ListDocument } from 'src/list/schemas/list.schema';
import { Customer, CustomerDocument } from 'src/customer/schemas/customer.schema';
import { GlAssetCode, GlAssetCodeDocument } from 'src/gl-asset-code/schemas/create-gl-asset.schema';
import { AssetCategory, AssetCategoryDocument } from 'src/asset-management/asset-categories/schemas/asset-cat.schema';

@Injectable()
export class NewClientManagementService {
    constructor(
        @InjectModel(Expense.name)
        private readonly expenseModel: Model<ExpenseDocument>,
        @InjectModel(Purchase.name)
        private readonly purchaseModel: Model<PurchaseDocument>,
        @InjectModel(PurchaseOrder.name)
        private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
        @InjectModel(GoodsReceipt.name)
        private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
        @InjectModel(InvoiceReceipt.name)
        private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
        @InjectModel(ProductionEvent.name)
        private readonly productionEventModel: Model<ProductionEventDocument>,
        @InjectModel(WasteEvent.name)
        private readonly wasteEventModel: Model<WasteEventDocument>,
        @InjectModel(InventoryTransfer.name)
        private readonly inventoryTransferModel: Model<InventoryTransferDocument>,
        @InjectModel(Inventory.name)
        private readonly inventoryModel: Model<InventoryDocument>,
        @InjectModel(InventoryHistory.name)
        private readonly inventoryHistoryModel: Model<InventoryHistoryDocument>,
        @InjectModel(ManualVendorInvoice.name)
        private readonly manualVendorInvoiceModel: Model<ManualVendorInvoiceDocument>,
        @InjectModel(ManualVendorPayment.name)
        private readonly manualVendorPaymentModel: Model<ManualVendorPaymentDocument>,
        @InjectModel(ManualCustomerPayment.name)
        private readonly manualCustomerPaymentModel: Model<ManualCustomerPaymentDocument>,
        @InjectModel(ManualCustomerInvoice.name)
        private readonly manualCustomerInvoiceModel: Model<ManualCustomerInvoiceDocument>,
        @InjectModel(AssetAqu.name)
        private readonly assetMasterModel: Model<AssetAquDocument>,
        @InjectModel(AssetAquTrans.name)
        private readonly assetAquTransModel: Model<AssetAquTransDocument>,
        @InjectModel(AssetAquDep.name)
        private readonly assetAquDepModel: Model<AssetAquDepDocument>,
        @InjectModel(AssetRetirement.name)
        private readonly assetRetirementModel: Model<AssetRetirementDocument>,
        @InjectModel(Order.name)
        private readonly orderModel: Model<OrderDocument>,
        @InjectModel(GlVoucher.name)
        private readonly glVoucherModel: Model<GlVoucherDocument>,
        @InjectModel(GlAccountGroup.name)
        private readonly glAccountGroupModel: Model<GlAccountGroupDocument>,
        @InjectModel(GlAccount.name)
        private readonly glAccountModel: Model<GlAccountDocument>,
        @InjectModel(GlAccountSet.name)
        private readonly glAccountSetModel: Model<GlAccountSetDocument>,
        @InjectModel(GlAccountMapping.name)
        private readonly glAccountMappingModel: Model<GlAccountMappingDocument>,
        private readonly primeCostService: PrimeCostService,
        private readonly profitLossService: ProfitLossService,
        private readonly balanceSheetService: BalanceSheetService,
        private readonly newClientHelperService: NewClientHelperService,

        @InjectModel(UnitOfMeasure.name)
        private readonly unitOfMeasureModel: Model<UnitOfMeasureDocument>,

        @InjectModel(Vendor.name)
        private readonly vendorModel: Model<VendorDocument>,
        @InjectModel(Material.name)
        private readonly materialModel: Model<MaterialDocument>,
        @InjectModel(PurchaseCategory.name)
        private readonly purchaseCategoryModel: Model<PurchaseCategoryDocument>,
        @InjectModel(MenuCategory.name)
        private readonly menuCategoryModel: Model<MenuCategoryDocument>,
        @InjectModel(List.name)
        private readonly listModel: Model<ListDocument>,
        @InjectModel(Customer.name)
        private customerModel: Model<CustomerDocument>,
        @InjectModel(AssetCategory.name)
        private readonly assetCategoryModel: Model<AssetCategoryDocument>,

    ) { }


    async deleteProcess(req: any,
        dto: CreateDeleteProcessDto) {

        const reqData = {
            user: {
                supplierId: dto.supplierId,
            },
        };

        let queryToApply: any = {};
        if (!dto.isAllTime) {
            const startDate = new Date(dto.startDate);
            const endDate = new Date(dto.endDate);
            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);
            queryToApply.createdAt = {
                $gte: startDate,
                $lte: endDate,
            }
        }

        if (dto.isExpenses) {
            await this.expenseModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isPurchases) {
            await this.purchaseModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isPO) {
            const purchaseOrdersToDelete = await this.purchaseOrderModel.find({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            })
            const deletedPurchaseOrderIds = purchaseOrdersToDelete.map(po => po._id.toString());

            await this.purchaseOrderModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
            if (deletedPurchaseOrderIds && deletedPurchaseOrderIds?.length > 0) {
                await this.goodsReceiptModel.deleteMany({ purchaseOrderId: { $in: deletedPurchaseOrderIds } });
                await this.invoiceReceiptModel.deleteMany({ purchaseOrderId: { $in: deletedPurchaseOrderIds } });
            }
        }
        if (dto.isProdEvent) {
            await this.productionEventModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isWasteEvent) {
            await this.wasteEventModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isStockTransfer) {
            await this.inventoryTransferModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isInventory) {
            await this.inventoryModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isInventoryHistory) {
            await this.inventoryHistoryModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isVendorPayment) {
            await this.manualVendorPaymentModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isVendorInvoice) {
            await this.manualVendorInvoiceModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isCustomerPayment) {
            await this.manualCustomerPaymentModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isCustomerInvoice) {
            await this.manualCustomerInvoiceModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isAssetMaster) {
            await this.assetMasterModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isAssetAquTrans) {
            await this.assetAquTransModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isAssetDep) {
            await this.assetAquDepModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isAssetRetirement) {
            await this.assetRetirementModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isOrder) {
            await this.orderModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isGLVoucher) {
            await this.glVoucherModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
        if (dto.isResetCOA) {
            await this.glAccountGroupModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });

            await this.glAccountSetModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });

            await this.glAccountModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
            await this.glAccountMappingModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId)
            });

        }
        if (dto.isResetPrimeCost) {
            await this.primeCostService.defaultTemplate(reqData);
        }
        if (dto.isResetProfitLoss) {
            await this.profitLossService.defaultTemplate(reqData);
        }
        if (dto.isResetBalanceSheet) {
            await this.balanceSheetService.defaultTemplate(reqData);
        }
        if (dto.isMaterial) {
            await this.materialModel.deleteMany({
                supplierId: new mongoose.Types.ObjectId(dto.supplierId),
                ...queryToApply
            });
        }
    }

    async excelProcessing(req, dto: ImportProcessDto, file: Express.Multer.File) {
        file = file[0];
        switch (dto.type) {
            case BulkImportType.MenuItem:
                this.newClientHelperService.handleMenuImport(req, file, dto);
                break;
            case BulkImportType.Material:
                this.newClientHelperService.handleMaterialImport(req, file, dto);
                break;
            case BulkImportType.Purchase:
                this.newClientHelperService.handlePurchasesImport(req, file, dto);
                break;
            case BulkImportType.Expense:
                this.newClientHelperService.handleExpenseImport(req, file, dto);
                break;
            case BulkImportType.PO:
                this.newClientHelperService.handlePurchaseOrderImport(req, file, dto);
                break;
            case BulkImportType.ProductionEvent:
                this.newClientHelperService.handleProductionEventImport(req, file, dto);
                break;
            case BulkImportType.WasteEvent:
                this.newClientHelperService.handleWasteEventImport(req, file, dto);
                break;
            case BulkImportType.VendorInvoice:
                this.newClientHelperService.handleManualVendorInvoiceImport(req, file, dto);
                break;
            case BulkImportType.CustomerInvoice:
                this.newClientHelperService.handleManualCustomerInvoiceImport(req, file, dto);
                break;
            case BulkImportType.AssetMaster:
                this.newClientHelperService.handleAssetMasterImport(req, file, dto);
                break;
            case BulkImportType.AssetAcq:
                this.newClientHelperService.handleAssetAquisitionImport(req, file, dto);
                break;
        }
    }

    async getAllMasterData(supplierId: string) {

        const UoM = await this.unitOfMeasureModel.find(
            {
                supplierId: supplierId,
                baseUnit: { $ne: null },
                deletedAt: null,
            }
        ).select('name nameAr');

        const vendors = await this.vendorModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('name nameAr');

        const materials = await this.materialModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('name nameAr');

        const purchaseCategory = await this.purchaseCategoryModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('name nameAr');

        const menuCategory = await this.menuCategoryModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('name nameAr');

        const glAccounts = await this.glAccountModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('glNumber name nameAr');

        const lists = await this.listModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('type name nameAr');

        const customers = await this.customerModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('name email');

        const assetCategory = await this.assetCategoryModel.find({
            supplierId: supplierId,
            deletedAt: null,
        }).select('name, nameAr');


        return {
            uom: UoM,
            vendors: vendors,
            materials: materials,
            pocategory: purchaseCategory,
            menucategory: menuCategory,
            glAccounts: glAccounts,
            lists: lists,
            customers: customers,
            assetCategory: assetCategory
        };
    }
}
