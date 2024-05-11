import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import Excel = require('exceljs');
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ImportProcessDto } from './dto/import-process.dto';
import { AssetAcquisition, AssetMaster, CustomerInvoice, ExpenseTemplate, GoodsReceiptTemplate, MaterialTemplate, MenuItemTemplate, ProductionEventTemplate, PurchaseOrderTemplate, PurchaseTemplate, VendorInvoice, WasteEventTemplate } from './constant/template.constant';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { MaterialType, ProcurementType, SalesOrderType } from 'src/material/enum/en';
import { Material, MaterialDocument } from 'src/material/schemas/material.schema';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { TaxIndication } from 'src/expense/enum/en';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Purchase, PurchaseDocument } from 'src/purchase/schemas/purchase.schema';
import { Expense, ExpenseDocument } from 'src/expense/schemas/expense.schema';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { GoodsReceipt, GoodsReceiptDocument } from 'src/goods-receipt/schemas/goods-receipt.schema';
import { InvoiceReceipt, InvoiceReceiptDocument } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { PurchaseOrderStatus } from 'src/purchase-order/enum/en';
import { UnitOfMeasure, UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { MenuCategory, MenuCategoryDocument } from 'src/menu/schemas/menu-category.schema';
import { Vendor, VendorDocument } from 'src/vendor/schemas/vendor.schema';
import { PurchaseCategory, PurchaseCategoryDocument } from 'src/purchase-category/schemas/purchase-category.schema';
import { PurchaseService } from 'src/purchase/purchase.service';
import { ExpenseService } from 'src/expense/expense.service';
import { GlAccount, GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { ProductionEventService } from 'src/production-event/production-event.service';
import { WasteEventService } from 'src/waste-event/waste-event.service';
import { List, ListDocument } from 'src/list/schemas/list.schema';
import { ListType } from 'src/core/Constants/enum';
import { ManualVendorInvoiceService } from 'src/manual-vendor-invoice/manual-vendor-invoice.service';
import { ManualCustomerInvoiceService } from 'src/manual-customer-invoice/manual-customer-invoice.service';
import { Customer, CustomerDocument } from 'src/customer/schemas/customer.schema';
import { CreateProductionEventDto } from 'src/production-event/dto/create-production-event.dto';
import { AssetAqu, AssetAquDocument } from 'src/asset-management/asset-aqu/schemas/asset-aqu.schema';
import { AssetCategory, AssetCategoryDocument } from 'src/asset-management/asset-categories/schemas/asset-cat.schema';
import { AssetAquService } from 'src/asset-management/asset-aqu/asset-aqu.service';
import { CreateAssetAquTransactionDto } from 'src/asset-management/asset-aqu/dto/create-asset-aqu-transaction.dto';

@Injectable()
export class NewClientHelperService {
    constructor(
        @InjectModel(MenuItem.name)
        private readonly menuItemModel: Model<MenuItemDocument>,
        @InjectModel(Material.name)
        private readonly materialModel: Model<MaterialDocument>,
        @InjectModel(Purchase.name)
        private readonly purchaseModel: Model<PurchaseDocument>,
        @InjectModel(Expense.name)
        private readonly expenseModel: Model<ExpenseDocument>,
        @InjectModel(PurchaseOrder.name)
        private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
        @InjectModel(GoodsReceipt.name)
        private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
        @InjectModel(InvoiceReceipt.name)
        private readonly invoiceReceiptModel: Model<InvoiceReceiptDocument>,
        @InjectModel(UnitOfMeasure.name)
        private readonly unitOfMeasureModel: Model<UnitOfMeasureDocument>,
        private readonly purchaseOrderService: PurchaseOrderService,
        @InjectModel(MenuCategory.name)
        private readonly menuCategoryModel: Model<MenuCategoryDocument>,
        @InjectModel(Vendor.name)
        private readonly vendorModel: Model<VendorDocument>,
        @InjectModel(PurchaseCategory.name)
        private readonly purchaseCategoryModel: Model<PurchaseCategoryDocument>,
        @InjectModel(GlAccount.name)
        private readonly glAccountModel: Model<GlAccountDocument>,
        @InjectModel(List.name)
        private readonly listModel: Model<ListDocument>,
        @InjectModel(Customer.name)
        private customerModel: Model<CustomerDocument>,
        @InjectModel(AssetAqu.name)
        private readonly assetMasterModel: Model<AssetAquDocument>,
        @InjectModel(AssetCategory.name)
        private readonly assetCategoryModel: Model<AssetCategoryDocument>,


        private readonly productionEventService: ProductionEventService,
        private readonly wasteEventService: WasteEventService,
        private readonly manualVendorInvoiceService: ManualVendorInvoiceService,
        private readonly manualCustomerInvoiceService: ManualCustomerInvoiceService,
        private readonly purchaseService: PurchaseService,
        private readonly expenseService: ExpenseService,
        private readonly assetAqService: AssetAquService

    ) { }

    async handleMenuImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);

        const menuCategory = await this.menuCategoryModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });

        try {
            let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
                name: row.getCell(MenuItemTemplate.name).text,
                nameAr: row.getCell(MenuItemTemplate.nameAr).text,
                description: row.getCell(MenuItemTemplate.description).text,
                descriptionAr: row.getCell(MenuItemTemplate.descriptionAr).text,
                categoryId: menuCategory.find((f: any) => f.name?.trim() ===
                    row.getCell(MenuItemTemplate.categoryId).text?.trim() ||
                    f.nameAr.trim() === row.getCell(MenuItemTemplate.categoryId).text?.trim()),
                price: row.getCell(MenuItemTemplate.price).value || 0,
                supplierId: dto.supplierId,
                addedBy: req.user.userId
            }));

            dtoArray = dtoArray.filter((f: any) => f.name != '' && f.categoryId != '' && f.price != null);
            this.menuItemModel.insertMany(dtoArray);
        } catch (err) {
            console.log("Err", err);
        }
    }

    async handleMaterialImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const uomList = await this.unitOfMeasureModel.find(
            {
                supplierId: dto.supplierId,
                baseUnit: { $ne: null },
                deletedAt: null,
            }
        )
        try {
            let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
                name: row.getCell(MaterialTemplate.name).text,
                nameAr: row.getCell(MaterialTemplate.nameAr).text,
                description: row.getCell(MaterialTemplate.description).text,
                descriptionAr: row.getCell(MaterialTemplate.descriptionAr).text,
                uomBase: row.getCell(MaterialTemplate.uomBase).text &&
                    uomList.find((f: any) => f.name ==
                        row.getCell(MaterialTemplate.uomBase).text?.trim() ||
                        f.nameAr == row.getCell(MaterialTemplate.uomBase).text?.trim())?._id,
                uomBuy: row.getCell(MaterialTemplate.uomPurchase).text &&
                    uomList.find((f: any) => f.name ==
                        row.getCell(MaterialTemplate.uomPurchase).text?.trim() ||
                        f.nameAr == row.getCell(MaterialTemplate.uomPurchase).text?.trim())?._id,
                materialType: MaterialType.RawMaterial,
                procurementType: ProcurementType.Purchased,
                salesOrderType: SalesOrderType.Both,
                supplierId: dto.supplierId,
                addedBy: req.user.userId
            }));

            dtoArray = dtoArray.filter((f: any) => f.name != '' && f.uomBase != '');
            this.materialModel.insertMany(dtoArray);
        } catch (err) {
            console.log("Err", err);
        }
    }
    async handlePurchasesImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const vendors = await this.vendorModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });


        const purchaseCategory = await this.purchaseCategoryModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });


        const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
            date: row.getCell(PurchaseTemplate.postedDate).text,
            vendorId:
                row.getCell(PurchaseTemplate.vendorId).text &&
                vendors.find((f: any) => f.name ==
                    row.getCell(PurchaseTemplate.vendorId).text?.trim() ||
                    f.nameAr == row.getCell(PurchaseTemplate.vendorId).text?.trim())?._id,
            restaurantId: dto.restaurantId,
            referenceNumber: row.getCell(PurchaseTemplate.referenceNumber).text,
            details: row.getCell(PurchaseTemplate.description).text,
            paymentType: row.getCell(PurchaseTemplate.paymentType).text,
            amount: row.getCell(PurchaseTemplate.amount).value,
            netAmount: row.getCell(PurchaseTemplate.netAmount).value,
            taxAmount: row.getCell(PurchaseTemplate.taxAmount).value,
            groupId: row.getCell(PurchaseTemplate.groupId).value,
            categoryId: row.getCell(PurchaseTemplate.categoryId).text &&
                purchaseCategory.find((f: any) => f.name ==
                    row.getCell(PurchaseTemplate.categoryId).text?.trim() ||
                    f.nameAr == row.getCell(PurchaseTemplate.categoryId).text?.trim())?._id,
            taxIndication: row.getCell(PurchaseTemplate.taxIndication).text?.trim(),
        }));

        const newArray = [];


        try {
            dtoArray.filter((f: any) => f.date != '' && f.amount > 0).forEach((item) => {
                const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);
                item.netAmount = Number(item.netAmount);
                item.taxAmount = Number(item.taxAmount);
                item.amount = Number(item.amount);
                if (groupIndex === -1) {
                    newArray.push({
                        groupId: item.groupId,
                        supplierId: dto.supplierId,
                        restaurantId: item.restaurantId,
                        vendorId: item.vendorId,
                        referenceNumber: item.referenceNumber,
                        paymentType: this.getHelperEnum('PAYMENTMETHOD', item.paymentType),
                        date: new Date(item.date),
                        items: [{
                            category: item.categoryId,
                            grossAmount: item.amount,
                            net: item.netAmount,
                            tax: item.taxAmount,
                            taxIndication: this.getHelperEnum('TAXINDICATION', item.taxIndication)
                        }],
                    });
                } else {
                    newArray[groupIndex].items.push(
                        {
                            category: item.categoryId,
                            grossAmount: item.amount,
                            net: item.netAmount,
                            tax: item.taxAmount,
                            taxIndication: this.getHelperEnum('TAXINDICATION', item.taxIndication)
                        }
                    );
                }
            });
            const reqData = {
                user: {
                    supplierId: dto.supplierId,
                },
            };
            for (let i = 0; i < newArray.length; i++) {
                const el = newArray[i];
                console.log("purchase el", el);
                await this.purchaseService.create(reqData, el);
            }


            // const finalDTO = await Promise.all(newArray.map(async (purchase) => {
            //     let totalGross = 0;
            //     let totalNet = 0;
            //     let totalTax = 0;
            //     for (let i = 0; i < purchase.items.length; i++) {
            //         const el = purchase.items[i];
            //         totalGross += parseFloat(el.grossAmount) || 0;
            //         totalNet += parseFloat(el.net) || 0;
            //         totalTax += parseFloat(el.tax) || 0;
            //     }
            //     return {
            //         ...purchase,
            //         totalGrossAmount: totalGross,
            //         totalNet: totalNet,
            //         totalTax: totalTax
            //     };
            // }));

            // this.purchaseModel.insertMany(finalDTO);

        } catch (error) {
            console.error(error);
        }
    }
    async handleExpenseImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const vendors = await this.vendorModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });

        const glAccounts = await this.glAccountModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });


        const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
            date: row.getCell(ExpenseTemplate.postedDate).text,
            vendorId:
                row.getCell(ExpenseTemplate.vendorId).text &&
                vendors.find((f: any) => f.name ==
                    row.getCell(ExpenseTemplate.vendorId).text?.trim() ||
                    f.nameAr == row.getCell(ExpenseTemplate.vendorId).text?.trim())?._id,
            restaurantId: dto.restaurantId,
            referenceNumber: row.getCell(ExpenseTemplate.referenceNumber).text,
            details: row.getCell(ExpenseTemplate.description).text,
            paymentType: row.getCell(ExpenseTemplate.paymentType).text,
            amount: row.getCell(ExpenseTemplate.amount).value,
            netAmount: row.getCell(ExpenseTemplate.netAmount).value,
            taxAmount: row.getCell(ExpenseTemplate.taxAmount).value,
            groupId: row.getCell(ExpenseTemplate.groupId).value,
            glAccountId: glAccounts.find((f: any) => f.glNumber ==
                row.getCell(ExpenseTemplate.glAccountId).text?.trim())?._id,
            taxIndication: row.getCell(ExpenseTemplate.taxIndication).text,
        }));

        const newArray = [];
        const expense = await this.expenseModel.findOne(
            {
                supplierId: dto.supplierId,
            },
            {},
            {
                sort: {
                    voucherNumber: -1,
                },
            },
        );
        let voucherNumber = expense ? expense.voucherNumber : 1
        try {
            dtoArray.filter((f: any) => f.date != '' && f.amount > 0).forEach((item) => {
                const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);
                const taxIndication = this.getHelperEnum('TAXINDICATION', item.taxIndication);

                item.netAmount = Number(item.netAmount);
                item.taxAmount = Number(item.taxAmount);
                item.amount = Number(item.amount);

                if (taxIndication == TaxIndication.Included) {
                    item.netAmount = roundOffNumber(
                        item.amount / (1 + Tax.rate / 100),
                    );
                    item.taxAmount = roundOffNumber(
                        item.amount - item.netAmount,
                    );
                } else if (taxIndication == TaxIndication.NotRelavant) {
                    item.netAmount = roundOffNumber(item.amount);
                    item.taxAmount = 0;
                } else if (taxIndication == TaxIndication.NotIncluded) {
                    item.netAmount = roundOffNumber(item.amount);
                    item.amount += item.netAmount ?? 0;
                }
                item.amount = roundOffNumber(item.amount);

                if (groupIndex === -1) {
                    voucherNumber = voucherNumber + 1;
                    newArray.push({
                        groupId: item.groupId,
                        supplierId: dto.supplierId,
                        restaurantId: item.restaurantId,
                        vendorId: item.vendorId,
                        referenceNumber: item.referenceNumber,
                        paymentType: this.getHelperEnum('PAYMENTMETHOD', item.paymentType),
                        date: new Date(item.date),
                        voucherNumber: voucherNumber,
                        items: [{
                            purpose: item.glAccountId,
                            grossAmount: item.amount,
                            net: item.netAmount,
                            tax: item.taxAmount,
                            taxIndication: this.getHelperEnum('TAXINDICATION', item.taxIndication)
                        }],
                    });
                } else {
                    newArray[groupIndex].items.push(
                        {
                            purpose: item.glAccountId,
                            grossAmount: item.amount,
                            net: item.netAmount,
                            tax: item.taxAmount,
                            taxIndication: item.taxIndication
                        }
                    );
                }
            });

            const reqData = {
                user: {
                    supplierId: dto.supplierId,
                },
            };
            for (let i = 0; i < newArray.length; i++) {
                const el = newArray[i];
                await this.expenseService.create(reqData, el);
            }
            // const finalDTO = await Promise.all(newArray.map(async (purchase) => {
            //     let totalGross = 0;
            //     let totalNet = 0;
            //     let totalTax = 0;
            //     for (let i = 0; i < purchase.items.length; i++) {
            //         const el = purchase.items[i];
            //         totalGross += parseFloat(el.grossAmount) || 0;
            //         totalNet += parseFloat(el.net) || 0;
            //         totalTax += parseFloat(el.tax) || 0;
            //     }
            //     return {
            //         ...purchase,
            //         totalGrossAmount: totalGross,
            //         totalNet: totalNet,
            //         totalTax: totalTax
            //     };
            // }));

            // this.expenseModel.insertMany(finalDTO);



        } catch (error) {
            console.error(error);
        }
    }
    async handlePurchaseOrderImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const vendors = await this.vendorModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });
        const materials = await this.materialModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        })
        const UoM = await this.unitOfMeasureModel.find(
            {
                supplierId: dto.supplierId,
                baseUnit: { $ne: null },
                deletedAt: null,
            }
        )
        const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
            date: row.getCell(PurchaseOrderTemplate.postedDate).text,
            vendorId:
                row.getCell(PurchaseOrderTemplate.vendorId).text &&
                vendors.find((f: any) => f.name ==
                    row.getCell(PurchaseOrderTemplate.vendorId).text?.trim() ||
                    f.nameAr == row.getCell(PurchaseOrderTemplate.vendorId).text?.trim())?._id,
            restaurantId: dto.restaurantId,
            materialId: row.getCell(PurchaseOrderTemplate.materialId).text &&
                materials.find((f: any) => f.name ==
                    row.getCell(PurchaseOrderTemplate.materialId).text?.trim() ||
                    f.nameAr == row.getCell(PurchaseOrderTemplate.materialId).text?.trim())?._id,
            uom: row.getCell(PurchaseOrderTemplate.uom).text &&
                UoM.find((f: any) => f.name ==
                    row.getCell(PurchaseOrderTemplate.uom).text?.trim() ||
                    f.nameAr == row.getCell(PurchaseOrderTemplate.uom).text?.trim())?._id,
            paymentType: row.getCell(PurchaseOrderTemplate.paymentType).text,
            totalAmount: row.getCell(PurchaseOrderTemplate.totalAmount).value,
            unitPrice: row.getCell(PurchaseOrderTemplate.unitPrice).value,
            qty: row.getCell(PurchaseOrderTemplate.qty).value,
            groupId: row.getCell(PurchaseOrderTemplate.groupId).value,
            quickPO: row.getCell(PurchaseOrderTemplate.quickPO).value
        }));

        const newArray = [];
        try {
            dtoArray.filter((f: any) => f.date != '' && f.totalAmount > 0).forEach((item) => {
                const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);

                item.unitPrice = Number(item.unitPrice);
                item.totalAmount = Number(item.totalAmount);
                item.qty = Number(item.qty);

                if (groupIndex === -1) {
                    newArray.push({
                        groupId: item.groupId,
                        supplierId: dto.supplierId,
                        restaurantId: item.restaurantId,
                        vendorId: item.vendorId,
                        paymentMethod: this.getHelperEnum('PAYMENTMETHOD', item.paymentType),
                        date: new Date(item.date),
                        isSimplified: item.quickPO,
                        items: [{
                            materialId: item.materialId,
                            stock: item.qty,
                            cost: item.unitPrice,
                            uom: item.uom,
                            stockValue: item.totalAmount
                        }],
                    });
                } else {
                    newArray[groupIndex].items.push(
                        {
                            materialId: item.materialId,
                            stock: item.qty,
                            cost: item.unitPrice,
                            uom: item.uom,
                            stockValue: item.totalAmount
                        }
                    );
                }
            });

            const reqData = {
                user: {
                    supplierId: dto.supplierId,
                },
            };

            console.log("newArray", newArray);
            for (let i = 0; i < newArray.length; i++) {
                const el = newArray[i];
                console.log("el", el);
                await this.purchaseOrderService.create(reqData, el, null);
            }


            // let poNumber = 100001;
            // const lastPurchaseOrder = await this.purchaseOrderModel.findOne(
            //     { supplierId: dto.supplierId },
            //     {},
            //     {
            //         sort: {
            //             poNumber: -1,
            //         },
            //     },
            // );
            // if (lastPurchaseOrder && lastPurchaseOrder.poNumber) {
            //     poNumber = lastPurchaseOrder.poNumber
            // }

            // console.log("newArray", newArray);
            // const finalDTO = await Promise.all(newArray.map(async (purchase) => {
            //     let totalCost = 0;
            //     let totalTax = 0;
            //     poNumber = poNumber + 1
            //     for (let i = 0; i < purchase.items.length; i++) {
            //         const el = purchase.items[i];
            //         const itemTaxableAmount = roundOffNumber(el.cost / (1 + Tax.rate / 100));
            //         el.tax = (itemTaxableAmount * Tax.rate) / 100;
            //         el.netPrice = itemTaxableAmount;
            //         el.stockValue = el.stock * el.cost;
            //         totalCost += el.stockValue;
            //         totalTax += el.tax;
            //     }
            //     return {
            //         ...purchase,
            //         addedBy: req.user.userId,
            //         supplierId: dto.supplierId,
            //         totalCost: totalCost,
            //         tax: totalTax,
            //         poNumber: poNumber,
            //         status: purchase.isSimplified ? PurchaseOrderStatus.Invoiced : PurchaseOrderStatus.New
            //     };
            // }));

            // const poResp = await this.purchaseOrderModel.insertMany(finalDTO);
            // console.log("poResp", poResp);

            // const getQuickPO = poResp.filter((f: any) => f.isSimplified);
            // let counter = 1;
            // const postFix = (new Date().getFullYear() % 100) + '-';
            // if (getQuickPO?.length > 0) {

            //     let _lastDocNo = await this.goodsReceiptModel.findOne(
            //         {
            //             supplierId: dto.supplierId,
            //             $expr: {
            //                 $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
            //             },
            //         },
            //         {},
            //         {
            //             sort: {
            //                 _id: -1,
            //             },
            //         },
            //     )
            //     if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
            //         _lastDocNo.docNumber = _lastDocNo.docNumber.replace('GR-', '');
            //         const arr = _lastDocNo.docNumber.split('-');
            //         if (arr.length > 0) {
            //             counter = parseInt(arr[1], 10);
            //         }
            //     }

            //     const finalGR = await Promise.all(getQuickPO.map(async (gr) => {
            //         const _docNumber = 'GR-' + postFix + String(counter + 1).padStart(5, '0');
            //         counter += 1;
            //         return {
            //             supplierId: gr.supplierId,
            //             vendorId: gr.vendorId,
            //             restaurantId: gr.restaurantId,
            //             purchaseOrderId: gr._id,
            //             items: gr.items,
            //             totalCost: gr.totalCost,
            //             tax: gr.tax,
            //             addedBy: gr.addedBy,
            //             date: gr.date,
            //             docNumber: _docNumber
            //         }
            //     }));
            //     console.log("finalGR", finalGR);
            //     await this.goodsReceiptModel.insertMany(finalGR);


            //     counter = 1;
            //     let _lastDocIRNo = await this.invoiceReceiptModel.findOne(
            //         {
            //             supplierId: dto.supplierId,
            //             $expr: {
            //                 $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
            //             },
            //         },
            //         {},
            //         {
            //             sort: {
            //                 _id: -1,
            //             },
            //         },
            //     );
            //     if (_lastDocIRNo && _lastDocIRNo.docNumber && _lastDocIRNo.docNumber != '') {
            //         _lastDocIRNo.docNumber = _lastDocIRNo.docNumber.replace('IR-', '');
            //         const arr = _lastDocIRNo.docNumber.split('-');
            //         if (arr.length > 0) {
            //             counter = parseInt(arr[1], 10) + 1;
            //         }
            //     }

            //     const finalIR = await Promise.all(getQuickPO.map(async (gr) => {
            //         const _docNumber = 'IR-' + postFix + String(counter + 1).padStart(5, '0');
            //         counter += 1;
            //         return {
            //             supplierId: gr.supplierId,
            //             vendorId: gr.vendorId,
            //             restaurantId: gr.restaurantId,
            //             purchaseOrderId: gr._id,
            //             items: gr.items,
            //             totalCost: gr.totalCost,
            //             tax: gr.tax,
            //             addedBy: gr.addedBy,
            //             date: gr.date,
            //             docNumber: _docNumber
            //         }
            //     }));
            //     console.log("finalGR", finalIR);
            //     await this.invoiceReceiptModel.insertMany(finalIR);
            // }
        } catch (error) {
            console.log("error", error);
        }
    }

    // async handleGoodsReceiptImport(req, file, dto: ImportProcessDto) {

    //     const workBook = new Excel.Workbook();
    //     await workBook.xlsx.readFile(file.path);
    //     const worksheet = await workBook.getWorksheet(1);

    //     const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
    //         date: row.getCell(GoodsReceiptTemplate.postedDate).text,
    //         restaurantId: row.getCell(GoodsReceiptTemplate.restaurantId).text,
    //         materialId: row.getCell(GoodsReceiptTemplate.materialId).text,
    //         uom: row.getCell(GoodsReceiptTemplate.uom).text,
    //         poNumber: row.getCell(GoodsReceiptTemplate.poNumber).text,
    //         totalAmount: row.getCell(GoodsReceiptTemplate.totalAmount).value,
    //         unitPrice: row.getCell(GoodsReceiptTemplate.unitPrice).value,
    //         qty: row.getCell(GoodsReceiptTemplate.qty).value,
    //     }));

    //     const newArray = [];

    //     try {
    //         dtoArray.filter((f: any) => f.date != '' && f.totalAmount > 0).forEach((item) => {
    //             const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);

    //             item.unitPrice = Number(item.unitPrice);
    //             item.totalAmount = Number(item.totalAmount);
    //             item.qty = Number(item.qty);

    //             if (groupIndex === -1) {
    //                 newArray.push({
    //                     supplierId: dto.supplierId,
    //                     restaurantId: item.restaurantId,
    //                     date: new Date(item.date),
    //                     poNumber: item.poNumber,
    //                     items: [{
    //                         materialId: item.materialId,
    //                         stock: item.qty,
    //                         cost: item.unitPrice,
    //                         uom: item.uom,
    //                         stockValue: item.totalAmount
    //                     }],
    //                 });
    //             } else {
    //                 newArray[groupIndex].items.push(
    //                     {
    //                         materialId: item.materialId,
    //                         stock: item.qty,
    //                         cost: item.unitPrice,
    //                         uom: item.uom,
    //                         stockValue: item.totalAmount
    //                     }
    //                 );
    //             }
    //         });

    //         const poNumbers = newArray.map(po => po.poNumber.toString());

    //         const allPOData = await this.purchaseOrderModel.find({ poNumber: { $in: poNumbers } });
    //         let counter = 1;
    //         const postFix = (new Date().getFullYear() % 100) + '-';
    //         let _lastDocNo = await this.goodsReceiptModel.findOne(
    //             {
    //                 supplierId: dto.supplierId,
    //                 $expr: {
    //                     $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
    //                 },
    //             },
    //             {},
    //             {
    //                 sort: {
    //                     _id: -1,
    //                 },
    //             },
    //         )
    //         if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
    //             _lastDocNo.docNumber = _lastDocNo.docNumber.replace('GR-', '');
    //             const arr = _lastDocNo.docNumber.split('-');
    //             if (arr.length > 0) {
    //                 counter = parseInt(arr[1], 10);
    //             }
    //         }
    //         const finalDTO = await Promise.all(newArray.map(async (purchase) => {
    //             let totalCost = 0;
    //             let totalTax = 0;
    //             const _docNumber = 'GR-' + postFix + String(counter + 1).padStart(5, '0');
    //             counter += 1;
    //             for (let i = 0; i < purchase.items.length; i++) {
    //                 const el = purchase.items[i];
    //                 const itemTaxableAmount = roundOffNumber(el.cost / (1 + Tax.rate / 100));
    //                 el.tax = (itemTaxableAmount * Tax.rate) / 100;
    //                 el.netPrice = itemTaxableAmount;
    //                 el.stockValue = el.stock * el.cost;
    //                 totalCost += el.stockValue;
    //                 totalTax += el.tax;
    //             }
    //             return {
    //                 ...purchase,
    //                 addedBy: req.user.userId,
    //                 supplierId: dto.supplierId,
    //                 totalCost: totalCost,
    //                 tax: totalTax,
    //                 purchaseOrderId: allPOData.find((f: any) => f.poNumber == purchase.poNumber)['_id'],
    //                 docNumber: _docNumber
    //             };
    //         }));

    //         console.log("finalDTO", finalDTO);
    //     } catch (error) {
    //         console.log("finalDTO error", error);
    //     }

    // }

    // async handleInvoiceReceiptImport(req, file, dto: ImportProcessDto) {

    //     const workBook = new Excel.Workbook();
    //     await workBook.xlsx.readFile(file.path);
    //     const worksheet = await workBook.getWorksheet(1);

    //     const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
    //         date: row.getCell(GoodsReceiptTemplate.postedDate).text,
    //         restaurantId: row.getCell(GoodsReceiptTemplate.restaurantId).text,
    //         materialId: row.getCell(GoodsReceiptTemplate.materialId).text,
    //         uom: row.getCell(GoodsReceiptTemplate.uom).text,
    //         poNumber: row.getCell(GoodsReceiptTemplate.poNumber).text,
    //         totalAmount: row.getCell(GoodsReceiptTemplate.totalAmount).value,
    //         unitPrice: row.getCell(GoodsReceiptTemplate.unitPrice).value,
    //         qty: row.getCell(GoodsReceiptTemplate.qty).value,
    //     }));

    //     const newArray = [];

    //     try {
    //         dtoArray.filter((f: any) => f.date != '' && f.totalAmount > 0).forEach((item) => {
    //             const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);

    //             item.unitPrice = Number(item.unitPrice);
    //             item.totalAmount = Number(item.totalAmount);
    //             item.qty = Number(item.qty);

    //             if (groupIndex === -1) {
    //                 newArray.push({
    //                     supplierId: dto.supplierId,
    //                     restaurantId: item.restaurantId,
    //                     date: new Date(item.date),
    //                     poNumber: item.poNumber,
    //                     items: [{
    //                         materialId: item.materialId,
    //                         stock: item.qty,
    //                         cost: item.unitPrice,
    //                         uom: item.uom,
    //                         stockValue: item.totalAmount
    //                     }],
    //                 });
    //             } else {
    //                 newArray[groupIndex].items.push(
    //                     {
    //                         materialId: item.materialId,
    //                         stock: item.qty,
    //                         cost: item.unitPrice,
    //                         uom: item.uom,
    //                         stockValue: item.totalAmount
    //                     }
    //                 );
    //             }
    //         });

    //         const poNumbers = newArray.map(po => po.poNumber.toString());

    //         const allPOData = await this.purchaseOrderModel.find({ poNumber: { $in: poNumbers } });
    //         let counter = 1;
    //         const postFix = (new Date().getFullYear() % 100) + '-';
    //         let _lastDocIRNo = await this.invoiceReceiptModel.findOne(
    //             {
    //                 supplierId: dto.supplierId,
    //                 $expr: {
    //                     $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
    //                 },
    //             },
    //             {},
    //             {
    //                 sort: {
    //                     _id: -1,
    //                 },
    //             },
    //         );
    //         if (_lastDocIRNo && _lastDocIRNo.docNumber && _lastDocIRNo.docNumber != '') {
    //             _lastDocIRNo.docNumber = _lastDocIRNo.docNumber.replace('IR-', '');
    //             const arr = _lastDocIRNo.docNumber.split('-');
    //             if (arr.length > 0) {
    //                 counter = parseInt(arr[1], 10) + 1;
    //             }
    //         }
    //         const finalDTO = await Promise.all(newArray.map(async (purchase) => {
    //             let totalCost = 0;
    //             let totalTax = 0;
    //             const _docNumber = 'IR-' + postFix + String(counter + 1).padStart(5, '0');
    //             counter += 1;
    //             for (let i = 0; i < purchase.items.length; i++) {
    //                 const el = purchase.items[i];
    //                 const itemTaxableAmount = roundOffNumber(el.cost / (1 + Tax.rate / 100));
    //                 el.tax = (itemTaxableAmount * Tax.rate) / 100;
    //                 el.netPrice = itemTaxableAmount;
    //                 el.stockValue = el.stock * el.cost;
    //                 totalCost += el.stockValue;
    //                 totalTax += el.tax;
    //             }
    //             return {
    //                 ...purchase,
    //                 addedBy: req.user.userId,
    //                 supplierId: dto.supplierId,
    //                 totalCost: totalCost,
    //                 tax: totalTax,
    //                 purchaseOrderId: allPOData.find((f: any) => f.poNumber == purchase.poNumber)['_id'],
    //                 docNumber: _docNumber
    //             };
    //         }));

    //         console.log("finalDTO", finalDTO);
    //     } catch (error) {
    //         console.log("finalDTO error", error);
    //     }

    // }

    async handleProductionEventImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const materials = await this.materialModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        })
        const UoM = await this.unitOfMeasureModel.find(
            {
                supplierId: dto.supplierId,
                baseUnit: { $ne: null },
                deletedAt: null,
            }
        )

        try {
            let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
                date: row.getCell(ProductionEventTemplate.postedDate).text,
                materialId: row.getCell(ProductionEventTemplate.materialId).text &&
                    materials.find((f: any) => f.name ==
                        row.getCell(ProductionEventTemplate.materialId).text?.trim() ||
                        f.nameAr == row.getCell(ProductionEventTemplate.materialId).text?.trim())?._id,
                uom: row.getCell(ProductionEventTemplate.uom).text &&
                    UoM.find((f: any) => f.name ==
                        row.getCell(ProductionEventTemplate.uom).text?.trim() ||
                        f.nameAr == row.getCell(PurchaseOrderTemplate.uom).text?.trim())?._id,
                qty: row.getCell(ProductionEventTemplate.qty).value,
                supplierId: dto.supplierId,
                addedBy: req.user.userId
            }));

            dtoArray = dtoArray.filter((f: any) => f.date != '' && f.materialId != '' && f.uom != null);
            const reqData = {
                user: {
                    supplierId: dto.supplierId,
                },
            };

            for (let i = 0; i < dtoArray.length; i++) {
                const el = dtoArray[i];
                const dtoData: CreateProductionEventDto = {
                    date: new Date(el?.date),
                    materialId: el?.materialId,
                    quantity: Number(el?.qty),
                    restaurantId: dto.restaurantId,
                    uom: el?.uom
                }
                console.log("dtoData", dtoData);

                await this.productionEventService.create(reqData, dtoData, null);
            }

        } catch (err) {
            console.log("Err", err);
        }
    }
    async handleWasteEventImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const materials = await this.materialModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        })
        const UoM = await this.unitOfMeasureModel.find(
            {
                supplierId: dto.supplierId,
                baseUnit: { $ne: null },
                deletedAt: null,
            }
        )

        const lists = await this.listModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
            type: ListType.WasteReason
        });


        try {
            let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
                date: new Date(row.getCell(WasteEventTemplate.postedDate).text),
                materialId: row.getCell(WasteEventTemplate.materialId).text &&
                    materials.find((f: any) => f.name ==
                        row.getCell(WasteEventTemplate.materialId).text?.trim() ||
                        f.nameAr == row.getCell(WasteEventTemplate.materialId).text?.trim())?._id,
                uom: row.getCell(WasteEventTemplate.uom).text &&
                    UoM.find((f: any) => f.name ==
                        row.getCell(WasteEventTemplate.uom).text?.trim() ||
                        f.nameAr == row.getCell(WasteEventTemplate.uom).text?.trim())?._id,
                quantity: Number(row.getCell(WasteEventTemplate.qty).value),
                reason: row.getCell(WasteEventTemplate.reason).text &&
                    lists.find((f: any) =>
                        f.name?.trim() ==
                        row.getCell(WasteEventTemplate.reason).text?.trim() ||
                        f.nameAr?.trim() == row.getCell(WasteEventTemplate.reason).text?.trim())?._id,
                supplierId: dto.supplierId,
                addedBy: req.user.userId,
                restaurantId: dto.restaurantId
            }));

            dtoArray = dtoArray.filter((f: any) => f.date != '' && f.materialId != '' && f.uom != null);
            const reqData = {
                user: {
                    supplierId: dto.supplierId,
                },
            };

            for (let i = 0; i < dtoArray.length; i++) {
                const el = dtoArray[i];
                console.log("el", el);
                await this.wasteEventService.create(reqData, el);
            }

        } catch (err) {
            console.log("Err", err);
        }
    }

    async handleManualVendorInvoiceImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const vendors = await this.vendorModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });
        const glAccounts = await this.glAccountModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });

        const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
            date: row.getCell(VendorInvoice.postedDate).text,
            vendorId:
                row.getCell(VendorInvoice.vendorId).text &&
                vendors.find((f: any) => f.name ==
                    row.getCell(VendorInvoice.vendorId).text?.trim() ||
                    f.nameAr == row.getCell(VendorInvoice.vendorId).text?.trim())?._id,
            restaurantId: dto.restaurantId,
            details: row.getCell(VendorInvoice.description).text,
            amount: row.getCell(VendorInvoice.amount).value,
            taxAmount: row.getCell(VendorInvoice.taxAmount).value,
            groupId: row.getCell(VendorInvoice.groupId).value,
            glAccountId: glAccounts.find((f: any) => f.glNumber ==
                row.getCell(VendorInvoice.glAccountId).text?.trim())?._id,
        }));

        const newArray = [];
        dtoArray.filter((f: any) => f.date != '' && f.amount > 0).forEach((item) => {
            const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);
            if (groupIndex === -1) {
                newArray.push({
                    groupId: item.groupId,
                    supplierId: dto.supplierId,
                    restaurantId: item.restaurantId,
                    vendorId: item.vendorId,
                    text: item.details,
                    date: new Date(item.date),
                    items: [{
                        expense: item.glAccountId,
                        amount: item.amount,
                        tax: item.taxAmount,
                    }],
                });
            } else {
                newArray[groupIndex].items.push(
                    {
                        expense: item.glAccountId,
                        amount: item.amount,
                        tax: item.taxAmount
                    }
                );
            }
        });

        const reqData = {
            user: {
                supplierId: dto.supplierId,
            },
        };

        for (let i = 0; i < newArray.length; i++) {
            const el = newArray[i];
            console.log("el", el);
            await this.manualVendorInvoiceService.create(reqData, el, null);
        }

    }

    async handleManualCustomerInvoiceImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const customers = await this.customerModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });

        const glAccounts = await this.glAccountModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });

        const dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
            date: row.getCell(CustomerInvoice.postedDate).text,
            customerId:
                row.getCell(CustomerInvoice.customerId).text &&
                customers.find((f: any) => f.name ==
                    row.getCell(CustomerInvoice.customerId).text?.trim() ||
                    f.email == row.getCell(CustomerInvoice.customerId).text?.trim())?._id,
            restaurantId: dto.restaurantId,
            details: row.getCell(CustomerInvoice.description).text,
            amount: row.getCell(CustomerInvoice.amount).value,
            taxAmount: row.getCell(CustomerInvoice.taxAmount).value,
            groupId: row.getCell(CustomerInvoice.groupId).value,
            glAccountId: glAccounts.find((f: any) => f.glNumber ==
                row.getCell(CustomerInvoice.glAccountId).text?.trim())?._id,
        }));

        const newArray = [];
        dtoArray.filter((f: any) => f.date != '' && f.amount > 0).forEach((item) => {
            const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);
            if (groupIndex === -1) {
                newArray.push({
                    groupId: item.groupId,
                    supplierId: dto.supplierId,
                    restaurantId: item.restaurantId,
                    customerId: item.customerId,
                    text: item.details,
                    date: new Date(item.date),
                    items: [{
                        expense: item.glAccountId,
                        amount: item.amount,
                        tax: item.taxAmount,
                    }],
                });
            } else {
                newArray[groupIndex].items.push(
                    {
                        expense: item.glAccountId,
                        amount: item.amount,
                        tax: item.taxAmount
                    }
                );
            }
        });

        const reqData = {
            user: {
                supplierId: dto.supplierId,
            },
        };

        for (let i = 0; i < newArray.length; i++) {
            const el = newArray[i];
            await this.manualCustomerInvoiceService.create(reqData, el, null);
        }
    }

    async handleAssetMasterImport(req, file, dto: ImportProcessDto) {
        console.log("Master Import process start");
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);

        const assetCategory = await this.assetCategoryModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });
        console.log("assetCategory", assetCategory);
        try {
            let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
                name: row.getCell(AssetMaster.name).text,
                nameAr: row.getCell(AssetMaster.nameAr).text,
                lifeSpanNo: row.getCell(AssetMaster.lifeSpanNo).value,
                aquisitionDate: row.getCell(AssetMaster.aquisitionDate).text ?
                    row.getCell(AssetMaster.aquisitionDate).text : null,
                depreciationDate: null,
                retirementDate: null,
                acquisitionValue: row.getCell(AssetMaster.aquisitionValue).value,
                glAssetCategoryId: row.getCell(AssetMaster.categoryId).text &&
                    assetCategory.find((f: any) => f.name ==
                        row.getCell(AssetMaster.categoryId).text?.trim() ||
                        f.nameAr == row.getCell(AssetMaster.categoryId).text?.trim())?._id,
                supplierId: dto.supplierId,
                addedBy: req.user.userId,
                restaurantId: dto.restaurantId
            }));
            console.log("dtoArray", dtoArray);
            dtoArray = dtoArray.filter((f: any) => f.name != '' && f.glAssetCategoryId != '');
            console.log("dtoArray", dtoArray);
            this.assetMasterModel.insertMany(dtoArray);
        } catch (err) {
            console.log("Err", err);
        }
    }

    async handleAssetAquisitionImport(req, file, dto: ImportProcessDto) {
        const workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(file.path);
        const worksheet = await workBook.getWorksheet(1);
        const vendors = await this.vendorModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });

        const assetData = await this.assetMasterModel.find({
            supplierId: dto.supplierId,
            deletedAt: null,
        });
        console.log("Process started here acq");
        try {
            let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
                date: new Date(row.getCell(AssetAcquisition.postedDate).text),
                vendorId:
                    row.getCell(AssetAcquisition.vendorId).text &&
                    vendors.find((f: any) => f.name ==
                        row.getCell(AssetAcquisition.vendorId).text?.trim() ||
                        f.nameAr == row.getCell(AssetAcquisition.vendorId).text?.trim())?._id,
                assetAquId: row.getCell(AssetAcquisition.assetId).text &&
                    assetData.find((f: any) => f.name ==
                        row.getCell(AssetAcquisition.assetId).text?.trim() ||
                        f.nameAr == row.getCell(AssetAcquisition.assetId).text?.trim())?._id,
                description: row.getCell(AssetAcquisition.description).text,
                grossAmount: Number(row.getCell(AssetAcquisition.grossAmount).value),
                tax: Number(row.getCell(AssetAcquisition.taxAmount).value),
                taxIndication: row.getCell(AssetAcquisition.taxIndication).text,
                paymentMethod: row.getCell(AssetAcquisition.paymentType).text,
                supplierId: dto.supplierId,
                addedBy: req.user.userId
            }));
            console.log("Process started here dtoArray", dtoArray);

            dtoArray = dtoArray.filter((f: any) => f.assetAquId != '' && f.grossAmount > 0);
            console.log("Process started after filter", dtoArray);
            const reqData = {
                user: {
                    supplierId: dto.supplierId,
                },
            };
            for (let i = 0; i < dtoArray.length; i++) {
                const el = dtoArray[i];
                console.log("el",el);
                const newdto: CreateAssetAquTransactionDto = {
                    amount: el.grossAmount,
                    assetAquId: el.assetAquId,
                    date: el.date,
                    description: el.description,
                    descriptionAr: "",
                    glAccountId: undefined,
                    grossAmount: el.grossAmount,
                    paymentType: el.paymentMethod == "Card" ? PaymentMethod.Card :
                        el.paymentMethod == "Cash" ? PaymentMethod.Cash :
                            PaymentMethod.Credit,
                    tax: el.tax,
                    taxIndication: el.taxIndication?.toLowerCase() == "included"
                        ? TaxIndication.Included : el.taxIndication?.toLowerCase() == "notincluded" ?
                            TaxIndication.NotIncluded : TaxIndication.NotRelavant,
                    vendorId: el.vendorId,
                    net: 0
                }

                console.log("newdto", newdto);
                await this.assetAqService.createAquTransaction(reqData, newdto);
            }
        } catch (err) {
            console.log("Err", err);
        }
    }

    getHelperEnum(dataType: string, dataValue: string) {
        dataValue = dataValue.toLowerCase();
        if (dataType == 'PAYMENTMETHOD') {
            switch (dataValue) {
                case "cash":
                    return PaymentMethod.Cash;
                case "card":
                    return PaymentMethod.Card;
                default:
                    return PaymentMethod.Other
            }
        }
        else if (dataType == 'TAXINDICATION') {
            switch (dataValue) {
                case "included":
                    return TaxIndication.Included;
                case "notincluded":
                    return TaxIndication.NotIncluded;
                default:
                    return TaxIndication.NotRelavant
            }
        }
    }

}