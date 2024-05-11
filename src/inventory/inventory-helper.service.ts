import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';

import { Inventory, InventoryDocument } from './schemas/inventory.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, PaginateModel, PaginateResult } from 'mongoose';
import { MaterialItemDocument } from 'src/purchase-order/schemas/material-item.schema';
import { InventoryService } from './inventory.service';
import * as moment from 'moment';
import { convertUtcToSupplierTimezone, roundOffNumber } from 'src/core/Helpers/universal.helper';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { InventoryAction, InventoryDirection } from './enum/en';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { CalculatedInventory } from './interface/calculated-inventory.interface';
import { UnitOfMeasureHelperService } from '../unit-of-measure/unit-of-measure-helper.service';
import { GoodsReceiptDocument } from 'src/goods-receipt/schemas/goods-receipt.schema';
import {
  InventoryHistory,
  InventoryHistoryDocument,
} from './schemas/inventory-history.schema';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { Recipe, RecipeDocument } from 'src/recipe/schema/recipe.schema';
import { MaterialType, ProcurementType, SalesOrderType } from 'src/material/enum/en';
import { RecipeService } from 'src/recipe/recipe.service';
import { WasteEventDocument } from 'src/waste-event/schema/waste-event.schema';
import mongoose from 'mongoose';
import {
  InventoryCount,
  InventoryCountDocument,
} from 'src/inventory-count/schema/inventory-count.schema';
import {
  ProfitDetail,
  ProfitDetailDocument,
} from 'src/profit-detail/schema/profit-detail.schema';
import { InventoryTransferDocument } from './schemas/inventory-transfer.schema';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { menuAdditionId } from '../../test1/constants/test.constant';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { MaterialService } from 'src/material/material.service';
import { OrderType } from 'src/order/enum/en.enum';
import { ItemConsumption, ItemConsumptionDocument } from './schemas/item-consumption.schema';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';
import { InventoryTransferNewDocument } from './schemas/inventory-transfer-new.schema';
import { WasteEventNewDocument } from 'src/waste-event/schema/waste-event-new.schema';
import { InventoryControlData, InventoryControlDataDocument } from './schemas/inventory-control.schema';
import { ItemConsumptionDetail, ItemConsumptionDetailDocument } from './schemas/item-consumption-detail.schema';
import { CostOfSalesDetail, CostOfSalesDetailDocument } from './schemas/cost-of-sales.schema';
import { MenuAddition, MenuAdditionDocument } from 'src/menu/schemas/menu-addition.schema';

@Injectable()
export class InventoryHelperService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @InjectModel(InventoryHistory.name)
    private readonly inventoryHistoryModel: Model<InventoryHistoryDocument>,
    @InjectModel(ItemConsumption.name)
    private readonly itemConsumptionModel: Model<ItemConsumptionDocument>,
    @InjectModel(ItemConsumptionDetail.name)
    private readonly itemConsumptionDetailModel: Model<ItemConsumptionDetailDocument>,

    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(ProfitDetail.name)
    private readonly profitDetailModel: Model<ProfitDetailDocument>,
    @Inject(forwardRef(() => UnitOfMeasureHelperService))
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    private readonly recipeService: RecipeService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(InventoryControlData.name)
    private readonly invControlDataModel: Model<InventoryControlDataDocument>,

    @InjectModel(CostOfSalesDetail.name)
    private readonly costofSalesDetailModel: Model<CostOfSalesDetailDocument>,

    @InjectModel(MenuAddition.name)
    private readonly menuAdditionModel: Model<MenuAdditionDocument>,
  ) { }

  async processInventoryChanges(req, goodsReceipt: GoodsReceiptDocument) {
    console.log("goodsReceipt", goodsReceipt);
    let totalCost = 0;
    if (goodsReceipt && goodsReceipt.additionalCost &&
      goodsReceipt.additionalCost > 0) {
      totalCost = goodsReceipt.items.reduce((sum, child) => sum + child.stockValue, 0);
      console.log("totalCost", totalCost);
    }

    for (const i in goodsReceipt.items) {
      goodsReceipt.items[i].stock = goodsReceipt.isReturn ? (-1 * goodsReceipt.items[i].stock) :
        goodsReceipt.items[i].stock;


      let inventoryItem: InventoryDocument = await this.inventoryModel
        .findOne({
          restaurantId: goodsReceipt.restaurantId,
          materialId: goodsReceipt.items[i].materialId,
        })
        .populate([{ path: 'materialId' }]);
      if (!inventoryItem) {
        inventoryItem = await this.inventoryService.create(req, {
          restaurantId: goodsReceipt.restaurantId,
          averageCost: goodsReceipt.items[i].netPrice,
          ...goodsReceipt.items[i].toObject(),
          isFirstGoodsReceipt: true,
        });
      }
      console.log("goodsReceipt.items[i].stock", goodsReceipt.items[i].stock);
      console.log("Before inventoryItem.averageCost", inventoryItem.averageCost);
      let avgCost = 0;
      if (totalCost > 0) {

        const qty = goodsReceipt.items[i].stock;
        const total = goodsReceipt.items[i].stockValue;
        const perUnitPrice = (total / qty);
        const totalAdditionalPerItem = (total / totalCost) * goodsReceipt.additionalCost;
        const perunitAdditionalCost = totalAdditionalPerItem / qty;
        const grossPerUnit = perunitAdditionalCost + perUnitPrice;
        const finalTotal = grossPerUnit * qty;
        avgCost = grossPerUnit / 1.15;
        const totalNet = avgCost * qty;

        console.log(`qty: ${qty} | total: ${total} | perUnitPrice: ${perUnitPrice} | 
        totalAdditionalPerItem: ${totalAdditionalPerItem} | perunitAdditionalCost : ${perunitAdditionalCost} |
        grossPerUnit: ${grossPerUnit} | finalTotal: ${finalTotal} | avgCost : ${avgCost} | totalNet :${totalNet}`)
        // inventoryItem.averageCost = avgCost;
        goodsReceipt.items[i].netPrice = avgCost;
      }
      console.log("after inventoryItem.averageCost", inventoryItem.averageCost);
      const calculatedInventory = await this.calculateInventoryItem(
        inventoryItem,
        goodsReceipt.items[i].toObject(),
        InventoryAction.GoodsReceipt,
      );

      inventoryItem = await this.saveInventory(
        inventoryItem,
        calculatedInventory,
        InventoryAction.GoodsReceipt,
        goodsReceipt,
        0
      );
      goodsReceipt.items[i].stock = Math.abs(goodsReceipt.items[i].stock);
      goodsReceipt.items[i].baseUom = inventoryItem.materialId.uomBase;
      goodsReceipt.items[i].baseUomStock =
        goodsReceipt.items[i].stock * calculatedInventory.conversionFactor;
      goodsReceipt.items[i].baseUomCost =
        goodsReceipt.items[i].netPrice / calculatedInventory.conversionFactor;

      inventoryItem.expirationDate = goodsReceipt.items[i].expirationDate;
      this.applyToMenuItem(inventoryItem);
    }
    await goodsReceipt.save();
    return goodsReceipt;
  }

  async calculateInventoryItem(
    inventoryItem: InventoryDocument,
    item: {
      stock: number;
      cost?: number;
      uom?: string;
      netPrice?: number;
    } = {
        cost: 0, // Initialize the cost property with a default value of 0
        stock: 0, // Initialize other properties as needed
        netPrice: 0, // Initialize other properties as needed
      },
    action: InventoryAction,
  ): Promise<CalculatedInventory> {
    // console.log('Testing', inventoryItem, item, action);

    const calculatedInventory: CalculatedInventory = {
      stock: inventoryItem.stock ?? 0,
      averageCost: inventoryItem.averageCost ?? 0,
      stockValue: inventoryItem.stockValue ?? 0,
      conversionFactor: 1,
      direction: InventoryDirection.Negataive,
    };
    let convert = { conversionFactor: 1 };
    if (item?.uom?.toString() != inventoryItem?.materialId?.uomBase?.toString()) {
      convert = await this.unitOfMeasureHelperService.getConversionFactor(
        item.uom,
        inventoryItem.materialId?.uomBase,
      );
    }

    if (action == InventoryAction.ReceivedWithTransfer) {
      item.cost = item.cost * convert.conversionFactor;
    }

    switch (action) {
      case InventoryAction.GoodsReceipt:
        if (inventoryItem.stock < 0) {
          inventoryItem.stock = 0;
        }        
        calculatedInventory.stock =
          inventoryItem.stock + item.stock * convert.conversionFactor;
       
        calculatedInventory.averageCost =
          ((inventoryItem.stock * inventoryItem.averageCost) +
            (item.netPrice * item.stock)) /
          calculatedInventory.stock;
       
        calculatedInventory.direction = InventoryDirection.Positive;
        break;
      case InventoryAction.ReceivedWithTransfer:
      case InventoryAction.ProductionEvent:
        if (inventoryItem.stock < 0) {
          inventoryItem.stock = 0;
        }
        calculatedInventory.stock =
          Number(inventoryItem.stock) + Number(item.stock) * Number(convert.conversionFactor);
        // console.log("ProductionEvent calculatedInventory stock", calculatedInventory.stock)
        // console.log("ProductionEvent inventoryItem stock", inventoryItem.stock)
        // console.log("ProductionEvent inventoryItem.averageCost", inventoryItem.averageCost)
        // console.log("ProductionEvent item.stock", item.stock)
        // console.log("ProductionEvent item.cost", item.cost)

        calculatedInventory.averageCost =
          (Number(inventoryItem.stock) * Number(inventoryItem.averageCost) +
            Number(item.cost) * Number(item.stock)) /
          Number(calculatedInventory.stock);

        console.log("ProductionEvent calculatedInventory.averageCost", calculatedInventory.averageCost)
        calculatedInventory.direction = InventoryDirection.Positive;
        break;

      case InventoryAction.SentWithTransfer:
        if (inventoryItem.stock < 0) {
          inventoryItem.stock = 0;
        }
        calculatedInventory.stock =
          inventoryItem.stock - item.stock * convert.conversionFactor;
        console.log(calculatedInventory);

        break;

      case InventoryAction.ItemSold:
      case InventoryAction.WasteEvent:
        calculatedInventory.stock =
          inventoryItem.stock - item.stock * convert.conversionFactor;
        break;
      case InventoryAction.InventoryCount:
      case InventoryAction.ManualCount:
        if (item.stock)
          calculatedInventory.stock = item.stock * convert.conversionFactor;
        if (item.cost)
          calculatedInventory.averageCost =
            item.cost / convert.conversionFactor;
        if (inventoryItem.stock - item.stock * convert.conversionFactor < 0) {
          calculatedInventory.direction = InventoryDirection.Positive;
        }

        break;
    }

    calculatedInventory.stockValue = roundOffNumber(
      calculatedInventory.stock * calculatedInventory.averageCost,
    );
    const stock = item.stock ? item.stock * convert.conversionFactor : 0;
    const cost = item.cost
      ? item.cost / convert.conversionFactor
      : inventoryItem.averageCost;
    const stockValue = stock && cost ? stock * cost : 0;

    calculatedInventory.sourceItemWithBase = {
      stock,
      cost,
      stockValue,
    };
    calculatedInventory.conversionFactor = convert.conversionFactor;
    return calculatedInventory;
  }

  async applyTransferRequestNew(req,
    inventoryTransfer: InventoryTransferNewDocument) {

    for (let i = 0; i < inventoryTransfer.items.length; i++) {
      //get target inventory
      let targetInventoryItem: InventoryDocument = await this.inventoryModel
        .findOne({
          restaurantId: inventoryTransfer.targetRestaurantId,
          materialId: inventoryTransfer.items[i].materialId,
        })
        .populate([{ path: 'materialId' }]);

      if (!targetInventoryItem) {
        //adding if not found
        targetInventoryItem = await this.inventoryService.create(req, {
          restaurantId:
            inventoryTransfer.targetRestaurantId.toString(),
          materialId: inventoryTransfer.items[i].materialId.toString(),
          stock: 0,
          averageCost: 0,
          storageArea: null,
          uom: inventoryTransfer.items[i].uom.toString(),
        });
      }

      //Source inventory
      let sourceInventoryItem: InventoryDocument = await this.inventoryModel
        .findOne({
          restaurantId: inventoryTransfer.sourceRestaurantId?.toString(),
          materialId: inventoryTransfer.items[i].materialId,
        })
        .populate([{ path: 'materialId' }]);

      //OverRide Source Average Cost
      let sourceAvgCost = sourceInventoryItem.averageCost;

      const matAdd = await this.restaurantMaterialModel.findOne({
        restaurantId: inventoryTransfer.sourceRestaurantId,
        materialId: inventoryTransfer.items[i].materialId
      }).populate([{
        path: 'materialId'
      }]);

      if (matAdd && matAdd != null && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            matAdd?.materialId?.uomBase?.toString(),
            inventoryTransfer.items[i]?.uom?.toString()
          );
        sourceAvgCost = roundOffNumber(matAdd?.overridePrice, 3) *
          convert.conversionFactor;
      }

      const calculatedInventory = await this.calculateInventoryItem(
        targetInventoryItem,
        {
          stock: inventoryTransfer.items[i].stock,
          uom: inventoryTransfer.items[i].uom.toString(),
          cost: sourceAvgCost,
        },
        InventoryAction.ReceivedWithTransfer,
      );

      targetInventoryItem = await this.saveInventory(
        targetInventoryItem,
        calculatedInventory,
        InventoryAction.ReceivedWithTransfer,
        inventoryTransfer,
      );

      this.applyToMenuItem(targetInventoryItem);

      const sourceCalculatedInventory = await this.calculateInventoryItem(
        sourceInventoryItem,
        {
          stock: inventoryTransfer.items[i].stock,
          uom: inventoryTransfer.items[i].uom.toString(),
          cost: sourceInventoryItem.averageCost,
        },
        InventoryAction.SentWithTransfer,
      );

      sourceInventoryItem = await this.saveInventory(
        sourceInventoryItem,
        sourceCalculatedInventory,
        InventoryAction.SentWithTransfer,
        inventoryTransfer,
      );

      this.applyToMenuItem(sourceInventoryItem);
    }

  }

  async applyTransferRequest(
    req,
    sourceInventoryItem: InventoryDocument,
    inventoryTransfer: InventoryTransferDocument,
  ) {
    for (const i in inventoryTransfer.target) {
      let targetInventoryItem: InventoryDocument = await this.inventoryModel
        .findOne({
          restaurantId: inventoryTransfer.target[i].targetRestaurantId,
          materialId: inventoryTransfer.materialId,
        })
        .populate([{ path: 'materialId' }]);

      if (!targetInventoryItem) {
        targetInventoryItem = await this.inventoryService.create(req, {
          restaurantId:
            inventoryTransfer.target[i].targetRestaurantId.toString(),
          materialId: inventoryTransfer.materialId.toString(),
          stock: 0,
          averageCost: 0,
          storageArea: null,
          uom: inventoryTransfer.uom.toString(),
        });
      }
      const calculatedInventory = await this.calculateInventoryItem(
        targetInventoryItem,
        {
          stock: inventoryTransfer.target[i].stock,
          uom: inventoryTransfer.uom.toString(),
          cost: sourceInventoryItem.averageCost,
        },
        InventoryAction.ReceivedWithTransfer,
      );

      console.log('########', calculatedInventory);

      targetInventoryItem = await this.saveInventory(
        targetInventoryItem,
        calculatedInventory,
        InventoryAction.ReceivedWithTransfer,
        inventoryTransfer,
      );

      this.applyToMenuItem(targetInventoryItem);
    }

    const sourceCalculatedInventory = await this.calculateInventoryItem(
      sourceInventoryItem,
      {
        stock: inventoryTransfer.stock,
        uom: inventoryTransfer.uom.toString(),
        cost: sourceInventoryItem.averageCost,
      },
      InventoryAction.SentWithTransfer,
    );

    sourceInventoryItem = await this.saveInventory(
      sourceInventoryItem,
      sourceCalculatedInventory,
      InventoryAction.SentWithTransfer,
      inventoryTransfer,
    );

    this.applyToMenuItem(sourceInventoryItem);
  }

  async applyWasteEventNew(wasteEvent: WasteEventNewDocument, isApproved: boolean = true) {
    await wasteEvent.populate([{ path: 'items.materialId' }]);
    let totalstockValue = 0;

    for (let i = 0; i < wasteEvent.items.length; i++) {
      let inventory: InventoryDocument = await this.inventoryModel.findOne({
        restaurantId: wasteEvent.restaurantId,
        materialId: wasteEvent.items[i].materialId._id,
      }).populate([{ path: 'materialId' }]);
      if (inventory) {
        inventory.materialId = wasteEvent.items[i].materialId;
        const calculatedInventory = await this.calculateInventoryItem(
          inventory,
          {
            stock: wasteEvent.items[i].quantity,
            uom: wasteEvent.items[i].uom?.toString(),
          },
          InventoryAction.WasteEvent,
        );
        if (isApproved) {
          await this.saveInventory(
            inventory,
            calculatedInventory,
            InventoryAction.WasteEvent,
            wasteEvent,
          );
        }

        let stockValue = calculatedInventory.sourceItemWithBase.stockValue;

        // check material addition if they allow override price
        const matAdd = await this.restaurantMaterialModel.findOne({
          restaurantId: wasteEvent.restaurantId,
          materialId: wasteEvent.items[i].materialId._id
        }).populate([{
          path: 'materialId'
        }]);
        if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
          const convert =
            await this.unitOfMeasureHelperService.getConversionFactor(
              matAdd?.materialId?.uomBase?.toString(),
              wasteEvent.items[i].uom?.toString()
            );

          stockValue = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor *
            wasteEvent.items[i].quantity;
        }
        if (isApproved) {
          totalstockValue += stockValue;
          wasteEvent.items[i].value = stockValue;
          wasteEvent.items[i].tempvalue = stockValue;
          await wasteEvent.save();
        }
        else {
          wasteEvent.items[i].tempvalue = stockValue;
          await wasteEvent.save();
        }
      }
    }
    return totalstockValue;
  }

  async applyWasteEvent(wasteEvent: WasteEventDocument) {
    await wasteEvent.populate([{ path: 'materialId' }]);
    let inventory: InventoryDocument = await this.inventoryModel.findOne({
      restaurantId: wasteEvent.restaurantId,
      materialId: wasteEvent.materialId._id,
    });

    if (inventory) {
      inventory.materialId = wasteEvent.materialId;
      const calculatedInventory = await this.calculateInventoryItem(
        inventory,
        {
          stock: wasteEvent.quantity,
          uom: wasteEvent.uom.toString(),
        },
        InventoryAction.WasteEvent,
      );
      await this.saveInventory(
        inventory,
        calculatedInventory,
        InventoryAction.WasteEvent,
        wasteEvent,
      );
      return calculatedInventory;
    }
    return false;
  }

  async applyInventoryCount(inventoryCount: InventoryCountDocument) {
    await inventoryCount.populate([
      {
        path: 'supplierId',
      },
    ]);

    for (const j in inventoryCount.items) {
      let count = 0;
      for (const i in inventoryCount.items[j].count) {
        let conversionFactor = 1;
        if (
          inventoryCount.items[j].count[i].uom.toString() !=
          inventoryCount.items[j].uomBase.toString()
        ) {
          const convert =
            await this.unitOfMeasureHelperService.getConversionFactor(
              inventoryCount.items[j].count[i].uom,
              inventoryCount.items[j].uomBase,
            );
          conversionFactor = convert.conversionFactor;
        }
        count += inventoryCount.items[j].count[i].quantity * conversionFactor;
      }
      let inventory: InventoryDocument = await this.inventoryModel
        .findOne({
          materialId: inventoryCount.items[j].materialId,
          restaurantId: inventoryCount.restaurantId,
        })
        .populate([{ path: 'materialId' }]);

      const calculatedInventory = await this.calculateInventoryItem(
        inventory,
        {
          stock: count,
          uom: inventory.materialId.uomBase.toString(),
        },
        InventoryAction.InventoryCount,
      );

      inventory.storage = inventoryCount.items[j].count;
      inventory.expirationDate = inventoryCount.items[j].expirationDate;
      inventory = await this.saveInventory(
        inventory,
        calculatedInventory,
        InventoryAction.InventoryCount,
        inventoryCount,
      );
      this.applyToMenuItem(inventory);

      //Override inventory count

      // const matAdd = await this.restaurantMaterialModel.findOne({
      //   restaurantId: inventoryCount.restaurantId,
      //   materialId: inventory.materialId._id
      // }).populate([{
      //   path: 'materialId'
      // }]);

      // if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
      //   const convert =
      //     await this.unitOfMeasureHelperService.getConversionFactor(
      //       matAdd?.materialId?.uomBase?.toString(),
      //       inventoryCount.items[j].uomBase?.toString(),
      //     );
      //   inventoryCount.items[j].differentialCountValue =
      //     roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor * inventoryCount.items[j].count[0].differentialCount;
      // }


    }
    if (inventoryCount.supplierId.autoTransferInventoryCountGl) {
      await this.glVoucherHelperService.handleInventoryCount(inventoryCount);
    }
  }

  async applyToMenuItem(inventoryItem: InventoryDocument) {
    // console.log("inventoryItem", inventoryItem);
    if (inventoryItem.materialId.isQuantityManaged) {
      const menuItem = await this.menuItemModel.findById(
        inventoryItem.materialId.menuItemId,
      );

      // console.log("menuItem", menuItem);
      if (menuItem) {
        const index = menuItem.quantities.findIndex((r) => {
          return (
            r.restaurantId.toString() == inventoryItem.restaurantId.toString()
          );
        });

        // console.log("inventoryItem.materialId.uomBase",inventoryItem.materialId.uomBase);
        // console.log("inventoryItem.materialId.uomSell",inventoryItem.materialId.uomSell);

        let conversionFactor = 1;
        if (
          inventoryItem.materialId.uomBase &&
          inventoryItem.materialId.uomSell &&
          inventoryItem.materialId.uomBase?.toString() !=
          inventoryItem.materialId.uomSell?.toString()
        ) {
          const convert =
            await this.unitOfMeasureHelperService.getConversionFactor(
              inventoryItem.materialId.uomBase,
              inventoryItem.materialId.uomSell,
            );
          conversionFactor = convert.conversionFactor;
        }

        const stockInSellType = inventoryItem.stock * conversionFactor;
        if (index > -1) {
          menuItem.quantities[index].quantity = stockInSellType;
          menuItem.quantities[index].cost =
            inventoryItem.averageCost / conversionFactor;
        } else {
          menuItem.quantities.push({
            restaurantId: inventoryItem.restaurantId,
            quantity: stockInSellType,
            cost: inventoryItem.averageCost / conversionFactor,
          });
        }
        console.log('Menu Item', index, menuItem.quantities);
        menuItem.manageQuantity = true;
        menuItem.save();
      }
    }
  }

  async handlePostSale(options: {
    restaurantId: string;
    menuItemId?: string;
    quantitiesSold: number;
    price: number;
    entity: any;
    paymentStatus?: string;
    menuAdditionId?: string;
    optionId?: string;
    salesOrderType?: string;
    optionUoM?: string;

  }) {
    let material = null;


    if (options.menuItemId && !options.menuAdditionId) {

      material = await this.materialModel.findOne({
        menuItemId: options.menuItemId,
        deletedAt: null
      });
    } else if (options.menuAdditionId && options.optionId) {

      //console.log("Check optionId material");
      material = await this.materialModel.findOne({
        menuAdditionId: options.menuAdditionId,
        menuAdditionOptionId: options.optionId,
        deletedAt: null
      });

      const menuAdditionData = await this.menuAdditionModel.findById(options.menuAdditionId);

      console.log("menuAdditionData", menuAdditionData);
      if (menuAdditionData) {
        const menuAdditionOpt = await menuAdditionData?.options?.find((f: any) => f._id == options.optionId);
        console.log("menuAdditionOpt", menuAdditionOpt);
        if (menuAdditionOpt && menuAdditionOpt?.uom) {
          options.optionUoM = menuAdditionOpt?.uom?.toString();
        }
      }
      console.log("options.optionUoM ", options.optionUoM);
    }



    if (material) {
      const recipe = await this.recipeModel.findOne({
        masterMaterialId: material._id,
        active: true,
        deletedAt: null
      });
      //console.log("recipe", recipe);
      let totalCost = 0,
        preparedData: any = null;
      if (recipe) {
        //console.log("I am in recipe");
        preparedData = await this.handleSemiFinishedMaterialPostSale(
          material,
          recipe,
          options,
        );
        if (preparedData) {
          totalCost = roundOffNumber(preparedData.overridePrice > 0 ?
            preparedData.overridePrice : preparedData.totalCost, 3);
        }

        const matAdd = await this.restaurantMaterialModel.findOne({
          restaurantId: options.restaurantId,
          materialId: material._id
        }).populate([{
          path: 'materialId'
        }]);
        console.log("##### matAdd ####", matAdd);
        if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
          totalCost = roundOffNumber(matAdd?.overridePrice, 3) * options.quantitiesSold;
        }


      } else {
        console.log("I am in Inventory");
        const inventory = await this.handleFinishedMaterialPostSale(
          material,
          options,
        );
        if (inventory) {
          totalCost = roundOffNumber(inventory.averageCost, 3) * options.quantitiesSold;

          // check material addition if they allow override price
          const matAdd = await this.restaurantMaterialModel.findOne({
            restaurantId: options.restaurantId,
            materialId: material._id
          }).populate([{
            path: 'materialId'
          }]);

          if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
            const convert =
              await this.unitOfMeasureHelperService.getConversionFactor(
                matAdd?.materialId?.uomBase?.toString(),
                inventory?.materialId?.uomSell
                  ? inventory?.materialId?.uomSell?.toString()
                  : inventory?.materialId?.uomBase?.toString()
              );
            console.log("convert22", convert);
            totalCost = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor * options.quantitiesSold;
          }
        }
      }

      console.log("totalCost", totalCost);
      if (totalCost) {
        let profitDetail = null;
        const checkExists = await this.profitDetailModel.findOne({
          supplierId: material.supplierId,
          restaurantId: options.restaurantId,
          menuItemId: options.menuItemId,
          orderId: options.entity._id,
        });
        let sellingPrice = options.price;
        if (options.entity.isEmployeeMeal) { 
          sellingPrice = 0;
        }
        if (!checkExists) {         
          profitDetail = await this.profitDetailModel.create({
            supplierId: material.supplierId,
            restaurantId: options.restaurantId,
            materialId: material._id,
            orderId: options.entity._id,
            menuItemId: options.menuItemId,
            quantity: options.quantitiesSold,
            unitPrice: sellingPrice,
            totalPrice: sellingPrice * options.quantitiesSold,
            unitCost: totalCost / options.quantitiesSold,
            totalCost: totalCost,
            profit: sellingPrice * options.quantitiesSold - totalCost,
            paymentStatus: options.paymentStatus,
          });
        }
        else {
          console.log("checkExists", checkExists);
          await this.profitDetailModel.findByIdAndUpdate(checkExists._id,
            {
              totalCost: checkExists.totalCost + totalCost,
              profit: checkExists.profit + (sellingPrice * options.quantitiesSold - totalCost),
              unitCost: checkExists.unitCost + (totalCost / options.quantitiesSold),
            },
            {
              new: true,
            });

          profitDetail = await this.profitDetailModel.findById(checkExists._id);
        }


        await profitDetail.populate([
          {
            path: 'supplierId',
          },
          {
            path: 'orderId'
          }
        ]);
        if (profitDetail.supplierId.autoTransferSalesGoodsGl) {

          this.glVoucherHelperService.handleSalesGoods(
            profitDetail,
            preparedData,
            options.entity.isEmployeeMeal
          );
        }

        //Update consumed sales count into daily inventory control report

        const req = {
          user: {
            supplierId: profitDetail.supplierId._id
          }
        }
        await this.saveInventoryControl(req,
          {
            restaurantId: options.restaurantId,
            materialId: material._id,
            salesConsumeQty: options.quantitiesSold,
            salesConsumeValue: totalCost
          });

        console.log("material.materialType", material.materialType);
        if (material.materialType == MaterialType.Finished) {
          const sellingPrice = options.price;
          console.log("material.sellingPrice", sellingPrice);
          await this.costofSalesDetailModel.create({
            supplierId: material.supplierId,
            restaurantId: options.restaurantId,
            orderId: options.entity._id,
            menuItemId: options.menuItemId,
            quantitySold: options.quantitiesSold,
            materialId: material._id,
            sellingPrice: sellingPrice * options.quantitiesSold,
            unitsellingPrice: sellingPrice,
            cost: totalCost,
            costperunit: totalCost / options.quantitiesSold
          });
        }
      }
    }
  }

  async handleFinishedMaterialPostSale(
    material: MaterialDocument,
    options: {
      restaurantId: string;
      entity: Document;
      quantitiesSold: number;
      optionUoM?: string
    }
  ) {
    let inventory: InventoryDocument = await this.inventoryModel.findOne({
      restaurantId: options.restaurantId,
      materialId: material._id,
      deletedAt: null
    });
    if (!inventory && material.procurementType == ProcurementType.Purchased) {
      console.log("Adding New Inventory");
      await this.inventoryService.create(
        {
          user: {
            userId: null,
            supplierId: material.supplierId,
          },
        },
        {
          restaurantId: options.restaurantId,
          materialId: material._id?.toString(),
          stock: 0,
          averageCost: 0,
          storageArea: null,
          uom: material.uomBase?.toString(),
        },
      );

      inventory = await this.inventoryModel.findOne({
        restaurantId: options.restaurantId,
        materialId: material._id,
        deletedAt: null
      });
    }

    if (inventory) {
      inventory.materialId = material;
      const calculatedInventory = await this.calculateInventoryItem(
        inventory,
        {
          stock: options.quantitiesSold,
          uom: options.optionUoM && options.optionUoM != "" && (inventory.materialId.uomSell
            ? inventory.materialId.uomSell?.toString()
            : material.uomBase?.toString()),
        },
        InventoryAction.ItemSold,
      );
      await this.saveInventory(
        inventory,
        calculatedInventory,
        InventoryAction.ItemSold,
        options.entity,
      );
      return inventory;
    }
  }

  async handleSemiFinishedMaterialPostSale(
    material: MaterialDocument,
    recipe: RecipeDocument,
    options: {
      restaurantId: string;
      entity: Document;
      quantitiesSold: number;
      uom?: string;
      salesOrderType?: string;
      menuItemId?: string
    },
    isProductionEvent = false,
  ) {

    //init prepare data object
    const preparedData = {
      items: [],
      totalCost: 0,
      overridePrice: 0
    };
    if (!options.uom) {
      options.uom = recipe.uom.toString();
    }
    // console.log("recipe", recipe);
    const inventoriesToSave = [];
    for (const i in recipe.components) {
      // console.log("recipe.components", recipe.components[i]);
      const materialData = await this.materialModel.findById(recipe.components[i].materialId?.toString());

      if (options.salesOrderType == OrderType.DineIn) {
        if (!materialData.salesOrderType ||
          materialData.salesOrderType == SalesOrderType.DineIn ||
          materialData.salesOrderType == SalesOrderType.Both) {
          let inventoryItem: InventoryDocument = await this.inventoryModel
            .findOne({
              restaurantId: options.restaurantId,
              materialId: recipe.components[i].materialId,
            })
            .populate([{ path: 'materialId' }]);

          if (!inventoryItem) {
            inventoryItem = await this.inventoryService.create(
              {
                user: {
                  userId: null,
                  supplierId: recipe.supplierId,
                },
              },
              {
                restaurantId: options.restaurantId,
                materialId: recipe.components[i].materialId.toString(),
                stock: 0,
                averageCost: 0,
                storageArea: null,
                uom: recipe.components[i].uom.toString(),
              },
            );
            await inventoryItem.populate([{ path: 'materialId' }]);
          }


          let stock =
            (recipe.components[i].stock * options.quantitiesSold) / recipe.quantity;
          if (options.uom != recipe.uom.toString()) {
            const convert =
              await this.unitOfMeasureHelperService.getConversionFactor(
                options.uom,
                recipe.uom,
              );

            stock *= convert.conversionFactor;
          }
          const calculatedInventory = await this.calculateInventoryItem(
            inventoryItem,
            {
              stock,
              uom: recipe.components[i].uom.toString(),
            },
            InventoryAction.ItemSold,
          );


          inventoriesToSave.push({
            inventoryItem,
            calculatedInventory,
          });

          let stockValue = calculatedInventory.sourceItemWithBase.stockValue;
          // check material addition if they allow override price
          const matAdd = await this.restaurantMaterialModel.findOne({
            restaurantId: options.restaurantId,
            materialId: recipe.components[i].materialId
          }).populate([{
            path: 'materialId'
          }]);

          if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
            const convert =
              await this.unitOfMeasureHelperService.getConversionFactor(
                matAdd?.materialId?.uomBase.toString(),
                recipe.components[i].uom.toString()
              );
            console.log("convert", convert);
            console.log("recipe.components[i]", recipe.components[i]);
            console.log("calculatedInventory.sourceItemWithBase.stock1", calculatedInventory.sourceItemWithBase);
            preparedData.overridePrice +=
              roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor *
              calculatedInventory.sourceItemWithBase.stock * options.quantitiesSold;

            stockValue = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor *
              calculatedInventory.sourceItemWithBase.stock * options.quantitiesSold;
          }
          else {
            preparedData.overridePrice += roundOffNumber(stockValue, 3);
          }
          console.log("preparedData.overridePrice ", preparedData.overridePrice);

          preparedData.items.push({
            ...recipe.components[i],
            materialId: inventoryItem.materialId,
            appliedStock: recipe.components[i].stock * options.quantitiesSold,
            baseUomStock: calculatedInventory.sourceItemWithBase.stock,
            stockValue: roundOffNumber(stockValue, 3),
            baseUomCost: calculatedInventory.sourceItemWithBase.cost,
            baseUom: inventoryItem.materialId.uomBase,
          });
          preparedData.totalCost +=
            roundOffNumber(stockValue, 3);
        }
      }
      else {
        if (!materialData.salesOrderType ||
          materialData.salesOrderType == SalesOrderType.Pickup ||
          materialData.salesOrderType == SalesOrderType.Both) {
          let inventoryItem: InventoryDocument = await this.inventoryModel
            .findOne({
              restaurantId: options.restaurantId,
              materialId: recipe.components[i].materialId,
            })
            .populate([{ path: 'materialId' }]);

          if (!inventoryItem) {
            inventoryItem = await this.inventoryService.create(
              {
                user: {
                  userId: null,
                  supplierId: recipe.supplierId,
                },
              },
              {
                restaurantId: options.restaurantId,
                materialId: recipe.components[i].materialId.toString(),
                stock: 0,
                averageCost: 0,
                storageArea: null,
                uom: recipe.components[i].uom.toString(),
              },
            );
            await inventoryItem.populate([{ path: 'materialId' }]);
          }
          // Calculating the stock of the recipe component based on quantity of prep material

          let stock =
            (recipe.components[i].stock * options.quantitiesSold) / recipe.quantity;
          //console.log("stock", stock);
          // console.log("recipe.components[i].stock", recipe.components[i].stock);
          // console.log("options.quantitiesSold", options.quantitiesSold);
          // console.log("recipe.quantity", recipe.quantity);

          // Checking production event uom against the prep material recipe uom 
          if (options.uom != recipe.uom.toString()) {
            const convert =
              await this.unitOfMeasureHelperService.getConversionFactor(
                options.uom,
                recipe.uom,
              );

            stock *= convert.conversionFactor;
            // console.log("stock in UoM", convert.conversionFactor);
            // console.log("stock in stock", stock);
          }

          //Calculating the inventory
          const calculatedInventory = await this.calculateInventoryItem(
            inventoryItem,
            {
              stock,
              uom: recipe.components[i].uom.toString(),
              cost: 0
            },
            InventoryAction.ItemSold,
          );
          inventoriesToSave.push({
            inventoryItem,
            calculatedInventory,
          });

          let stockValue = calculatedInventory.sourceItemWithBase.stockValue;
          // check material addition if they allow override price
          const matAdd = await this.restaurantMaterialModel.findOne({
            restaurantId: options.restaurantId,
            materialId: recipe.components[i].materialId
          }).populate([{
            path: 'materialId'
          }]);

          // console.log("recipe.components[i].materialId", recipe.components[i].materialId);
          // console.log("matAdd2", matAdd);
          // console.log("calculatedInventory.sourceItemWithBase.stock11",
          //   calculatedInventory.sourceItemWithBase);
          if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
            const convert =
              await this.unitOfMeasureHelperService.getConversionFactor(
                matAdd?.materialId?.uomBase.toString(),
                recipe.components[i].uom.toString()
              );
            // console.log("convert", convert);
            // console.log("recipe.components[i]", recipe.components[i]);
            // console.log("options.quantitiesSold", options.quantitiesSold);

            preparedData.overridePrice +=
              roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor *
              recipe.components[i].stock * options.quantitiesSold;

            stockValue = roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor *
              recipe.components[i].stock * options.quantitiesSold;
          }
          else {
            preparedData.overridePrice += roundOffNumber(stockValue, 3);
          }

          preparedData.items.push({
            ...recipe.components[i],
            materialId: inventoryItem.materialId,
            appliedStock: recipe.components[i].stock * options.quantitiesSold,
            baseUomStock: calculatedInventory.sourceItemWithBase.stock,
            stockValue: roundOffNumber(stockValue, 3),
            baseUomCost: calculatedInventory.sourceItemWithBase.cost,
            baseUom: inventoryItem.materialId.uomBase,
          });
          preparedData.totalCost +=
            roundOffNumber(stockValue, 3);


          console.log("preparedData.overridePrice22 ", preparedData.overridePrice);

        }
      }
    }
    console.log("options.quantitiesSold", options.quantitiesSold);

    if (inventoriesToSave && inventoriesToSave?.length > 0) {
      let consumptionItem: any = [];
      for (const i in inventoriesToSave) {
        const inventory = await this.saveInventory(
          inventoriesToSave[i].inventoryItem,
          inventoriesToSave[i].calculatedInventory,
          isProductionEvent
            ? InventoryAction.ProductionEvent
            : InventoryAction.ComponentsItemSold,
          options.entity,
        );

        this.applyToMenuItem(inventory);

        if (!isProductionEvent) {
          try {
            // await this.itemConsumptionModel.create({
            //   supplierId: inventoriesToSave[i].inventoryItem.supplierId,
            //   restaurantId: inventoriesToSave[i].inventoryItem.restaurantId,
            //   materialId: inventoriesToSave[i].inventoryItem.materialId,
            //   uomBase: inventoriesToSave[i].inventoryItem.uomBase,
            //   orderId: options.entity ? options.entity._id : null,
            //   menuItemId: options.menuItemId,
            //   quantitySold: options.quantitiesSold,
            //   conversionFactor: inventoriesToSave[i].calculatedInventory.conversionFactor,
            //   stock: inventoriesToSave[i].calculatedInventory.sourceItemWithBase.stock,
            //   cost: inventoriesToSave[i].calculatedInventory.sourceItemWithBase.cost,
            //   stockValue: inventoriesToSave[i].calculatedInventory.sourceItemWithBase.stockValue,
            //   averageCost: inventoriesToSave[i].calculatedInventory.averageCost
            // })

            consumptionItem.push({
              materialId: inventoriesToSave[i].inventoryItem.materialId,
              uomBase: inventoriesToSave[i].inventoryItem.uomBase,
              conversionFactor: inventoriesToSave[i].calculatedInventory.conversionFactor,
              stock: inventoriesToSave[i].calculatedInventory.sourceItemWithBase.stock,
              cost: inventoriesToSave[i].calculatedInventory.sourceItemWithBase.cost,
              stockValue: inventoriesToSave[i].calculatedInventory.sourceItemWithBase.stockValue,
              averageCost: inventoriesToSave[i].calculatedInventory.averageCost
            });

          } catch (error) {
            console.log(error);
          }
        }
      }

      if (!isProductionEvent) {
        await this.itemConsumptionDetailModel.create({
          supplierId: inventoriesToSave[0].inventoryItem.supplierId,
          restaurantId: inventoriesToSave[0].inventoryItem.restaurantId,
          orderId: options.entity ? options.entity._id : null,
          menuItemId: options?.menuItemId,
          quantitySold: options.quantitiesSold,
          items: consumptionItem
        })
      }
    }



    if (isProductionEvent) {
      await this.handleSemiFinishedMaterialPostProductionEvent(material, {
        restaurantId: options.restaurantId,
        uom: options.uom,
        stock: options.quantitiesSold,
        totalCost: preparedData.totalCost,
        entity: options.entity,
      });
    }
    return preparedData;
  }

  async handleSemiFinishedMaterialPostProductionEvent(
    material: MaterialDocument,
    options: {
      stock: number;
      uom: string;
      restaurantId: string;
      totalCost: number;
      entity: Document;
    },
  ) {
    let inventoryItem: InventoryDocument = await this.inventoryModel.findOne({
      restaurantId: options.restaurantId,
      materialId: material._id,
    });
    if (!inventoryItem) {
      inventoryItem = await this.inventoryService.create(
        {
          user: {
            userId: null,
            supplierId: material.supplierId,
          },
        },
        {
          restaurantId: options.restaurantId,
          materialId: material._id.toString(),
          stock: 0,
          averageCost: 0,
          storageArea: null,
          uom: options.uom.toString(),
        },
      );
    }
    inventoryItem.materialId = material;

    console.log("options.totalCost", options.totalCost);
    if (options.totalCost == null) {
      options.totalCost = 0;
    }
    const calculatedInventory = await this.calculateInventoryItem(
      inventoryItem,
      {
        stock: options.stock,
        cost: options.totalCost / options.stock,
        uom: options.uom.toString(),
      },
      InventoryAction.ProductionEvent,
    );

    console.log('########', calculatedInventory);

    inventoryItem = await this.saveInventory(
      inventoryItem,
      calculatedInventory,
      InventoryAction.ProductionEvent,
      options.entity,
    );

    this.applyToMenuItem(inventoryItem);
  }

  async saveInventory(
    inventory: InventoryDocument,
    calculatedInventory: CalculatedInventory,
    action: InventoryAction,
    entity: Document,
    finalAvgCost: number = 0
  ): Promise<InventoryDocument> {
    // console.log('For Saving', calculatedInventory);
    inventory.set({
      stock: calculatedInventory.stock,
      averageCost: finalAvgCost > 0 ? finalAvgCost : calculatedInventory.averageCost,
      stockValue: calculatedInventory.stockValue,
    });
    if (action == InventoryAction.InventoryCount) {
      inventory.virtualConsumption = 0;
    } else if (
      calculatedInventory.stock < 0 &&
      calculatedInventory.sourceItemWithBase.stock
    ) {
      inventory.virtualConsumption = inventory.virtualConsumption
        ? inventory.virtualConsumption - calculatedInventory.stock
        : calculatedInventory.stock;
    }
    await inventory.save();

    // const getAllRecipes = await this.recipeModel.find({
    //   'components.materialId': { $in: material._id }
    // });

    // for (let i = 0; i < getAllRecipes.length; i++) {
    //   const el: any = getAllRecipes[i];
    //   const restResp = await this.recipeService.updateRecipePrice(req, el._id);
    //   el.restaurantRecipePrice = restResp;
    //   await el.save();
    // }


    // console.log("after saving inventory", inventory)
    this.saveHistory(inventory, calculatedInventory, action, entity);
    return inventory;
  }

  async saveHistory(
    inventory: InventoryDocument,
    calculatedInventory: CalculatedInventory,
    action: InventoryAction,
    entity: Document | any,
  ) {
    // console.log("entity", entity);
    let _currentDate = new Date();
    if (entity && entity.date) {
      _currentDate = new Date(entity.date);
    }
    const timezone = TIMEZONE;
    _currentDate.setUTCHours(0);
    _currentDate.setUTCMinutes(59);
    _currentDate = new Date(_currentDate.toLocaleString('en', { timeZone: timezone }));
    // console.log("_currentDate", _currentDate);
    await this.inventoryHistoryModel.create({
      supplierId: inventory.supplierId,
      restaurantId: inventory.restaurantId,
      materialId: inventory.materialId,
      uomBase: inventory.uomBase,
      uomInventory: inventory.uomInventory,
      ...calculatedInventory.sourceItemWithBase,
      conversionFactor: calculatedInventory.conversionFactor,
      action,
      dataId: entity ? entity._id : null,
      date: entity && entity.date ? entity.date : _currentDate,
      direction: calculatedInventory.direction,
    });
  }

  //InventoryControl Data Report used to store daily transactions (In & Out) by combination of "Supplier, Restaurant, Material and Date"

  async saveInventoryControl(req: any, dto: any) {

    if (!dto.materialId && !dto.restaurantId) {
      return;
    }
    const timezone = TIMEZONE;

    const date = convertUtcToSupplierTimezone(
      new Date(),
      timezone,
    );
    date.setUTCHours(0);
    date.setUTCMinutes(0);

    const todayDateString = date;

    const exists = await this.invControlDataModel.findOne({
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
      materialId: new mongoose.Types.ObjectId(dto.materialId),
      date: todayDateString,
      restaurantId: new mongoose.Types.ObjectId(dto.restaurantId)
    });
    const currentInv = await this.inventoryModel.findOne({
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
      materialId: new mongoose.Types.ObjectId(dto.materialId),
      restaurantId: new mongoose.Types.ObjectId(dto.restaurantId)
    });

    if (exists) {
      // Extracting fields from DTO
      const { date, materialId, restaurantId, ...updateFields } = dto || {};

      // Constructing update object with $inc for each field
      const updateObj = {};
      for (const field in updateFields) {
        if (Object.prototype.hasOwnProperty.call(updateFields, field)) {
          updateObj[field] = updateFields[field]; // Just assign the value directly
        }
      }

      const totalIn = exists.totalICQtyGain + exists.productionCostQty + exists.stockTransferInQty + exists.purchaseQuantity +
        exists.startingStock;

      const totalInVal = exists.totalICValueGain + exists.productionCostValue + exists.stockTransferInValue + exists.purchaseValue +
        exists.startingStockValue;

      const totalOut = exists.totalICQtyLoss + exists.wasteQty + exists.stockTransferOutQty + exists.purchaseQuantity +
        exists.salesConsumeQty + exists.qtyProductionWasteEvent + exists.vendorReturnQty +
        exists.productionMaterialConsumeQty;

      const totalOutVal = exists.totalICValueLoss + exists.wasteValue + exists.stockTransferOutValue + exists.purchaseQuantity +
        exists.salesConsumeValue + exists.amountProductionWasteEvent + exists.vendorReturnValue +
        exists.productionMaterialConsumeValue;

      let additionalObj: any = {
        totalInQty: totalIn,
        totalInValue: totalInVal,
        totalOutQty: totalOut,
        totalOutValue: totalOutVal,
        stockQtyInSystem: currentInv ? currentInv.stock : 0,
        stockValueInSystem: currentInv ? currentInv.stockValue : 0,
        stockAvgCostInSystem: currentInv ? currentInv.averageCost : 0
      }
      await this.invControlDataModel.findByIdAndUpdate(exists._id,
        { $inc: updateObj, ...additionalObj },
        {
          new: true
        });

    } else {

      //FIRST TIME ENTRY FOR TODAY WITH THIS MATERIAL

      // UPDATE QTY & VALUE for ALL INBOUND = Minus | ALL  OUTBOUND = ADD
      // currentInv - purchaseqty- stinqty + wasteic + salesconsume

      // startingStock: currentInv ? currentInv.stock - dto.dto.purchaseQuantity  - dto. : 0,
      // startingStockValue: currentInv ? currentInv.stockValue : 0,

      function getStartingStock(currInvStock) {
        console.log("currInvStock", currInvStock);
        console.log("dto?.purchaseQuantity", dto);
        let inboundSum = dto?.totalICQtyGain || 0 + dto?.productionConsumeQty || 0 + dto?.stockTransferInQty || 0 + dto?.purchaseQuantity || 0;
        console.log("inboundSum", inboundSum);

        let outBoundSum = dto?.totalICQtyLoss || 0 + dto?.wasteQty || 0 + dto?.salesConsumeQty || 0 + dto?.qtyProductionWasteEvent || 0
          + dto?.productionConsumeQty || 0 + dto?.stockTransferOutQty || 0 + dto?.vendorReturnQty || 0;
        console.log("outBoundSum", outBoundSum);
        let finalStartingStock = currInvStock - inboundSum + outBoundSum;
        console.log("finalStartingStock", finalStartingStock);
        return finalStartingStock
      }

      function getStartingStockValue(currInvStockVal) {
        let inboundValueSum = dto?.totalICValueGain || 0 + dto?.productionCostValue || 0 + dto?.stockTransferInValue || 0 + dto?.purchaseValue || 0;
        console.log("currInvStockVal", currInvStockVal);
        let outBoundValueSum = dto?.totalICValueLoss || 0 + dto?.wasteValue || 0 + dto?.salesConsumeValue || 0 + dto?.amountProductionWasteEvent || 0
          + dto?.productionConsumeValue || 0 + dto?.stockTransferOutValue || 0 + dto?.vendorReturnValue || 0;

        let finalStartingStockValue = currInvStockVal - inboundValueSum + outBoundValueSum;
        console.log("finalStartingStockValue", finalStartingStockValue);
        return finalStartingStockValue
      }

      let startingStock = currentInv ? getStartingStock(currentInv.stock) : 0
      let startingStockValue = currentInv ? getStartingStockValue(currentInv.stockValue) : 0
      const exists = await this.invControlDataModel.create({
        ...dto,
        date: todayDateString,
        supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
        startingStock: startingStock,
        startingStockValue: startingStockValue,
        startingAvgCost: currentInv ? currentInv.averageCost : 0,
        stockQtyInSystem: currentInv ? currentInv.stock : 0,
        stockValueInSystem: currentInv ? currentInv.stockValue : 0,
        stockAvgCostInSystem: currentInv ? currentInv.averageCost : 0
      });

      const totalIn = exists.totalICQtyGain + exists.productionCostQty + exists.stockTransferInQty + exists.purchaseQuantity +
        exists.startingStock;

      const totalInVal = exists.totalICValueGain + exists.productionCostValue + exists.stockTransferInValue + exists.purchaseValue +
        exists.startingStockValue;

      const totalOut = exists.totalICQtyLoss + exists.wasteQty + exists.stockTransferOutQty + exists.purchaseQuantity +
        exists.salesConsumeQty + exists.qtyProductionWasteEvent + exists.vendorReturnQty +
        exists.productionMaterialConsumeQty;

      const totalOutVal = exists.totalICValueLoss + exists.wasteValue + exists.stockTransferOutValue + exists.purchaseQuantity +
        exists.salesConsumeValue + exists.amountProductionWasteEvent + exists.vendorReturnValue +
        exists.productionMaterialConsumeValue;


      exists.totalInQty = totalIn;
      exists.totalInValue = totalInVal;
      exists.totalOutQty = totalOut;
      exists.totalOutValue = totalOutVal;

      await exists.save();
    }
  }
}
