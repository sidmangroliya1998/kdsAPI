import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from './schemas/goods-receipt.schema';

import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';
import { I18nContext } from 'nestjs-i18n';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from 'src/purchase-order/schemas/purchase-order.schema';
import { PurchaseOrderStatus } from 'src/purchase-order/enum/en';
import { PurchaseOrderHelperService } from 'src/purchase-order/purchase-order-helper.service';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';

@Injectable()
export class GoodsReceiptHelperService {
  constructor(
    @InjectModel(GoodsReceipt.name)
    private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    private readonly inventoryHelperService: InventoryHelperService,
    private readonly purchaseOrderHelperService: PurchaseOrderHelperService,
    private readonly glVoucherHelperService: GlVoucherHelperService,
  ) {}

  async postGoodsReceiptCreate(
    req,
    goodsReceipt: GoodsReceiptDocument,
    loaded: boolean,
  ) {
    const purchaseOrder = await this.purchaseOrderModel.findOneAndUpdate(
      { _id: goodsReceipt.purchaseOrderId },
      {
        status: loaded
          ? PurchaseOrderStatus.Received
          : PurchaseOrderStatus.PartiallyReceived,
      },
      {
        new: true,
      },
    );

    // if (purchaseOrder) {
    //   this.purchaseOrderHelperService.postPurchaseOrderConfirmed(purchaseOrder);
    // }
    const response = await this.inventoryHelperService.processInventoryChanges(
      req,
      goodsReceipt,
    );
    await goodsReceipt.populate([
      {
        path: 'supplierId',
      },
    ]);
    if (goodsReceipt.supplierId.autoTransferGoodsReceiptGl) {
     await this.glVoucherHelperService.handleGoodsReceipt(goodsReceipt);
    }
    return response;
  }

  async validateGoodsReceipt(dto: CreateGoodsReceiptDto, i18n: I18nContext) {
    const goodsReceipts = await this.goodsReceiptModel.find({
      purchaseOrderId: dto.purchaseOrderId,
    });
    const purchaseOrder = await this.purchaseOrderModel.findById(
      dto.purchaseOrderId,
    );
    if (!purchaseOrder) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    let loadedItems = [],
      allowedItems = [],
      totalAllowed = 0,
      totalLoaded = 0;
    goodsReceipts.forEach((goodsReceipt) => {
      goodsReceipt.items.forEach((item) => {
        if (loadedItems[item.materialId.toString()]) {
          loadedItems[item.materialId.toString()] += item.stock;
        } else {
          loadedItems[item.materialId.toString()] = item.stock;
        }
        totalLoaded += item.stock;
      });
    });
    purchaseOrder.items.forEach((poi) => {
      allowedItems[poi.materialId.toString()] = poi.stock;
      totalAllowed += poi.stock;
    });   
    for (const i in dto.items) {
      if (!allowedItems[dto.items[i].materialId]) {
        throw new BadRequestException(
          `${dto.items[i].materialId} ${i18n.t('NOT_ALLOWED')}`,
        );
      }
      const totalAfterLoad = loadedItems[dto.items[i].materialId]
        ? loadedItems[dto.items[i].materialId] + dto.items[i].stock
        : dto.items[i].stock;    
      if (allowedItems[dto.items[i].materialId] < totalAfterLoad) {
        throw new BadRequestException(
          `Max ${
            allowedItems[dto.items[i].materialId]
          } quantities allowed for ${dto.items[i].materialId}`,
        );
      }
      totalLoaded += dto.items[i].stock;
    }
    return totalAllowed == totalLoaded;
  }
}
