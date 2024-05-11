import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryCountDto } from './dto/create-inventory-count.dto';
import { UpdateInventoryCountDto } from './dto/update-inventory-count.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  InventoryCount,
  InventoryCountDocument,
} from './schema/inventory-count.schema';
import { Model, PaginateModel } from 'mongoose';

import {
  Inventory,
  InventoryDocument,
} from 'src/inventory/schemas/inventory.schema';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { InventoryCountVariationStatus } from './enum/en';
import { Material, MaterialDocument } from 'src/material/schemas/material.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';

@Injectable()
export class InventoryCountHelperService {
  constructor(
    @InjectModel(InventoryCount.name)
    private readonly inventoryCountModel: Model<InventoryCountDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
  ) { }

  async prepareInventoryCountData(
    dto: CreateInventoryCountDto | UpdateInventoryCountDto,
    i18n,
    req: any
  ) {

    for (let i = 0; i < dto.items.length; i++) {
      const el = dto.items[i];

      const checkInv = await this.inventoryModel.find({
        restaurantId: dto.restaurantId,
        materialId: el.materialId
      });
      console.log("checkInv", checkInv);
      if (checkInv?.length == 0) {
        const material = await this.materialModel.findById(el.materialId);
        await this.inventoryModel.create({
          materialId: el.materialId,
          restaurantId: dto.restaurantId,
          stockValue: 0,
          stock: 0,
          averageCost: 0,
          addedBy: req.user.userId,
          supplierId: req.user.supplierId,
          uomBase: material.uomBase,
          uomInventory: material.uomInventory,
        })
      }
    }

    let inventories = await this.inventoryModel
      .find({
        restaurantId: dto.restaurantId,
        materialId: {
          $in: dto.items.map((i) => {
            return i.materialId;
          }),
        },
      })
      .populate([{ path: 'materialId' }]);
    inventories = inventories.reduce((acc, d) => {
      acc[d.materialId._id.toString()] = d;
      return acc;
    }, []);
    console.log(inventories);
    for (const j in dto.items) {
      if (!inventories[dto.items[j].materialId]) {
        throw new NotFoundException(i18n.t('error.NOT_FOUND'));
      }
      const inventory = inventories[dto.items[j].materialId];
      let count = 0;
      let purchaseCount = 0;
      let baseQty = 0;

      for (const i in dto.items[j].count) {
        let conversionFactor = 1;
        if (
          dto.items[j].count[i].uom.toString() !=
          inventory.materialId.uomBase.toString()
        ) {
          const convert =
            await this.unitOfMeasureHelperService.getConversionFactor(
              dto.items[j].count[i].uom,
              inventory.materialId.uomBase,
            );
          conversionFactor = convert.conversionFactor;
        }
        count += dto.items[j].count[i].quantity * conversionFactor;
        let baseQuantity = dto.items[j].count[i].quantity * conversionFactor;
        let variationQty = baseQuantity - inventory.stock;
        dto.items[j].count[i].baseQuantity = baseQuantity;
        dto.items[j].count[i].variationQuantity = variationQty;
        baseQty += baseQuantity;
        if (baseQuantity == inventory.stock) {
          dto.items[j].count[i].variationStatus = InventoryCountVariationStatus.Match;
        }
        else if (variationQty < inventory.stock) {
          dto.items[j].count[i].variationStatus = InventoryCountVariationStatus.Below;
        }
        else if (variationQty > inventory.stock) {
          dto.items[j].count[i].variationStatus = InventoryCountVariationStatus.Above;
        }

        let purchaseQtyFactor = 1;
        if (inventory.materialId.uomBuy && inventory.materialId.uomBuy != null
          && inventory.materialId.uomBuy != '' &&
          dto.items[j].count[i].uom.toString() !=
          inventory.materialId.uomBuy?.toString()) {
          const convertPurchase =
            await this.unitOfMeasureHelperService.getConversionFactor(
              dto.items[j].count[i].uom,
              inventory.materialId.uomBuy,
            );
          purchaseQtyFactor = convertPurchase.conversionFactor;

          dto.items[j].count[i].uomBuy = inventory.materialId.uomBuy;
        }
        purchaseCount += dto.items[j].count[i].quantity * purchaseQtyFactor;
        let purchaseQuantity = dto.items[j].count[i].quantity * purchaseQtyFactor;
        dto.items[j].count[i].purchaseQty = purchaseQuantity;
        dto.items[j].count[i].variationQuantityPurchase = purchaseQuantity - inventory.stock;
      }

      let differentialCount = count - inventory.stock;
      differentialCount =
        differentialCount > 0 ? differentialCount : differentialCount * -1;

      const variationQty = baseQty - inventory.stock;

      let purchaseQtyFactorBeforeApplied = 1;
      if (inventory.materialId.uomBuy && inventory.materialId.uomBuy != null
        && inventory.materialId.uomBuy != '' &&
        inventory.materialId.uomBase.toString() !=
        inventory.materialId.uomBuy?.toString()) {
        const convertPurchase =
          await this.unitOfMeasureHelperService.getConversionFactor(
            inventory.materialId.uomBase,
            inventory.materialId.uomBuy,
          );
        purchaseQtyFactorBeforeApplied = convertPurchase.conversionFactor;
      }
      let invAvgCost = inventory.averageCost;

      const matAdd = await this.restaurantMaterialModel.findOne({
        restaurantId: dto.restaurantId,
        materialId: inventory.materialId._id
      }).populate([{
        path: 'materialId'
      }]);

      if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
        const convert =
          await this.unitOfMeasureHelperService.getConversionFactor(
            matAdd?.materialId?.uomBase?.toString(),
            inventory.uomBase?.toString(),
          );
        invAvgCost =
          roundOffNumber(matAdd?.overridePrice, 3) * convert.conversionFactor;
      }
      dto.items[j] = {
        ...dto.items[j],
        uomBase: inventory.uomBase,
        countValue: invAvgCost * count,
        totalCount: count,
        onHandCount: inventory.stock,
        onHandCountValue: invAvgCost * inventory.stock, // inventory.stockValue
        differentialCount,
        differentialCountValue: invAvgCost * differentialCount,
        variationQuantity: variationQty,
        variationStatus: variationQty == 0 ? InventoryCountVariationStatus.Match :
          (variationQty < inventory.stock ? InventoryCountVariationStatus.Below :
            InventoryCountVariationStatus.Above),
        newPurchaseCount: purchaseCount,
        onHandPurchaseCount: inventory.stock * purchaseQtyFactorBeforeApplied,
        variationQuantityPurchase: purchaseCount - inventory.stock,
        onHandPurchaseValue: inventory.stockValue * purchaseQtyFactorBeforeApplied,
      };
    }

    return dto;
  }
}
