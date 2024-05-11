import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from './schemas/goods-receipt.schema';
import { QueryGoodsReceiptDto } from './dto/query-goods-receipt.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import { GoodsReceiptHelperService } from './goods-receipt-helper.service';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import mongoose from 'mongoose';
import { TaxIndication } from 'src/expense/enum/en';
import { TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
@Injectable()
export class GoodsReceiptService {
  constructor(
    @InjectModel(GoodsReceipt.name)
    private readonly goodsReceiptModel: Model<GoodsReceiptDocument>,
    @InjectModel(GoodsReceipt.name)
    private readonly goodsReceiptModelPag: PaginateModel<GoodsReceiptDocument>,
    private readonly goodReceiptHelperService: GoodsReceiptHelperService,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateGoodsReceiptDto,
    i18n: I18nContext,
  ): Promise<GoodsReceiptDocument> {

    console.log("dto", dto);

    const loaded = await this.goodReceiptHelperService.validateGoodsReceipt(
      dto,
      i18n,
    );
    const items: any = dto.items;
    let totalCost = 0;
    // items.forEach((i) => {
    //   const itemTaxableAmount = roundOffNumber(i.cost / (1 + Tax.rate / 100));
    //   i.tax = (itemTaxableAmount * Tax.rate) / 100;
    //   i.netPrice = itemTaxableAmount;
    //   i.stockValue = i.stock * i.cost;
    //   totalCost += i.stockValue;
    // });
    // const totalTaxableAmount = roundOffNumber(totalCost / (1 + Tax.rate / 100));
    // const tax = (totalTaxableAmount * Tax.rate) / 100;

    items.forEach((i) => {
      const itemTaxableAmount = dto.taxIndication == TaxIndication.Included ?
        (i.cost / (1 + Tax.rate / 100)) : i.cost;
      i.tax = dto.taxIndication == TaxIndication.Included ?
        (itemTaxableAmount * Tax.rate) / 100 : 0;
      i.netPrice = itemTaxableAmount;
      i.stockValue = i.stock * i.cost;
      totalCost += i.stockValue;
    });
    totalCost += dto.additionalCost ?? 0;
    const totalTaxableAmount = dto.taxIndication == TaxIndication.Included ?
      (totalCost / (1 + Tax.rate / 100)) : totalCost;
    const tax = dto.taxIndication == TaxIndication.Included ?
      (totalTaxableAmount * Tax.rate) / 100 : 0;

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.goodsReceiptModel.findOne(
      {
        supplierId: req.user.supplierId,
        $expr: {
          $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
        },
      },
      {},
      {
        sort: {
          _id: -1,
        },
      },
    )
    if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('GR-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'GR-' + postFix + String(counter).padStart(5, '0');


    let goodsReceipt: GoodsReceiptDocument =
      await this.goodsReceiptModel.create({
        ...dto,
        items,
        totalCost,
        tax,
        addedBy: req.user.userId,
        supplierId: req.user.supplierId,
        docNumber: _docNumber
      });

    if (dto.transType == TransStatus.Approved) {
      goodsReceipt = await this.goodReceiptHelperService.postGoodsReceiptCreate(
        req,
        goodsReceipt,
        loaded,
      );
    }

    return goodsReceipt;
  }

  async findAll(
    req: any,
    query: QueryGoodsReceiptDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GoodsReceiptDocument>> {
    let queryToApply: any = {};
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (req.query && req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.date = {
        $gte: startDate,
        $lte: endDate,
      };
      delete queryToApply.startDate;
      delete queryToApply.endDate;
    }
    if (req.query && req.query.poNumber && req.query.poNumber != '') {
      const poNumberQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$poNumber" },
            regex: req.query.poNumber,
            options: "i",
          }
        }
      };

      const poData = await this.purchaseOrderModel.find(poNumberQuery);

      if (poData.length > 0) {
        queryToApply = { ...queryToApply, purchaseOrderId: { $in: poData.map(po => po._id) } };
      }
    }
    if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
      const amountRangeQuery: any = {};

      if (req.query.minAmount > 0) {
        amountRangeQuery.$gte = Number(req.query.minAmount);
      }
      if (req.query.maxAmount > 0) {
        amountRangeQuery.$lte = Number(req.query.maxAmount);
      }
      queryToApply.totalCost = amountRangeQuery;
    }
    // if (req.query.restaurantIds) {
    //   queryToApply.restaurantId = {
    //     $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
    //   };
    // }
    if (req.query.restaurantIds) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: { $in: getAllRest?.restaurantId } },
          { restaurantId: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
        ];
      } else {
        queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: { $in: getAllRest?.restaurantId } },
        ];
      }
    }

    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }
    if (req.query && req.query.docNumber && req.query.docNumber !== '') {
      const docNumberQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$docNumber" },
            regex: req.query.docNumber,
            options: "i",
          }
        }
      };
      queryToApply = { ...queryToApply, ...docNumberQuery };
    }

    const records = await this.goodsReceiptModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
        deletedAt: null,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            }
          },
          {
            path: 'purchaseOrderId',
            select: {
              poNumber: 1
            }
          },
          {
            path: 'items.materialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            }
          },
          {
            path: 'items.vendorMaterialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            }
          },
          {
            path: 'items.uom',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            }
          },
          {
            path: 'items.storageArea',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            }
          },
          {
            path: 'addedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
        ]
      },
    );
    const aggregateResult = await this.goodsReceiptModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...queryToApply,
        },
      },
      {
        $group: {
          _id: null,
          totalWithTax: {
            $sum: '$totalCost',
          }
        },
      },
    ]);
    let response = {
      ...records,
      aggregateResult: aggregateResult[0]
    }
    return response;
  }

  async findOne(
    goodsReceiptId: string,
    i18n: I18nContext,
  ): Promise<GoodsReceiptDocument> {
    const exists = await this.goodsReceiptModel.findById(goodsReceiptId).populate([
      {
        path: 'restaurantId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        }
      },
      {
        path: 'purchaseOrderId',
        select: {
          poNumber: 1
        }
      },
      {
        path: 'items.materialId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        }
      },
      {
        path: 'items.vendorMaterialId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        }
      },
      {
        path: 'items.uom',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        }
      },
      {
        path: 'items.storageArea',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        }
      }
    ]);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    goodsReceiptId: string,
    dto: UpdateGoodsReceiptDto,
    i18n: I18nContext,
  ): Promise<GoodsReceiptDocument> {
    const goodsReceipt = await this.goodsReceiptModel.findByIdAndUpdate(
      goodsReceiptId,
      dto,
      {
        new: true,
      },
    );

    if (!goodsReceipt) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return goodsReceipt;
  }

  async remove(goodsReceiptId: string, i18n: I18nContext): Promise<boolean> {
    const goodsReceipt = await this.goodsReceiptModel.findByIdAndUpdate(
      goodsReceiptId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!goodsReceipt) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async updateApproval(req: any, Id: string, i18n: I18nContext): Promise<any> {

    let doc: any = await this.goodsReceiptModel.findById(Id);
    if (!doc) {
      throw new NotFoundException();
    }

    await this.goodsReceiptModel.findByIdAndUpdate(Id, {
      transType: TransStatus.Approved
    });

    const loaded = await this.goodReceiptHelperService.validateGoodsReceipt(
      doc,
      i18n,
    );

    await this.goodReceiptHelperService.postGoodsReceiptCreate(
      req,
      doc,
      loaded,
    );

    return doc;
  }
}
