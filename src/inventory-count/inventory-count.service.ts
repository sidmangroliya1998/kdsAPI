import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryCountDto } from './dto/create-inventory-count.dto';
import { UpdateInventoryCountDto } from './dto/update-inventory-count.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  InventoryCount,
  InventoryCountDocument,
} from './schema/inventory-count.schema';
import { Model, PaginateModel } from 'mongoose';
import { InventoryHelperService } from 'src/inventory/inventory-helper.service';
import { QueryInventoryCountDto } from './dto/query-inventory-count.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import mongoose, { PaginateResult } from 'mongoose';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import { InventoryCountStatus } from './enum/en';
import { InventoryCountHelperService } from './inventory-count-helper.service';
import {
  Inventory,
  InventoryDocument,
} from 'src/inventory/schemas/inventory.schema';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class InventoryCountService {
  constructor(
    @InjectModel(InventoryCount.name)
    private readonly inventoryCountModel: Model<InventoryCountDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(InventoryCount.name)
    private readonly inventoryCountModelPag: PaginateModel<InventoryCountDocument>,
    private readonly inventoryHelperService: InventoryHelperService,
    private readonly inventoryCountHelperService: InventoryCountHelperService,
  ) { }

  async create(
    req: any,
    dto: CreateInventoryCountDto,
    i18n: I18nContext,
  ): Promise<InventoryCountDocument> {
    dto = await this.inventoryCountHelperService.prepareInventoryCountData(
      dto,
      i18n,
      req
    );

    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.inventoryCountModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('IC-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'IC-' + postFix + String(counter).padStart(5, '0');
    const inventoryCount = await this.inventoryCountModel.create({
      ...dto,
      addedBy: req.user.userId,
      supplierId: req.user.supplierId,
      docNumber: _docNumber
    });

    return inventoryCount;
  }

  async findAll(
    req: any,
    query: QueryInventoryCountDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<InventoryCountDocument>> {
    let queryToApply: any = {};
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }
    // if (req.query.restaurantIds) {
    //   queryToApply.restaurantId = {
    //     $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
    //   };
    // }

    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }
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
    if (req.query && req.query.createdStartDate && req.query.createdEndDate) {
      const startDate = new Date(req.query.createdStartDate);
      const endDate = new Date(req.query.createdEndDate);
      startDate.setUTCHours(0);
      startDate.setUTCMinutes(0);
      endDate.setUTCHours(23);
      endDate.setUTCMinutes(59);

      queryToApply.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
      delete queryToApply.createdStartDate;
      delete queryToApply.createdEndDate;
    }
    if (req.query.createdByIds) {
      queryToApply.addedBy = {
        $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }
    if (req.query && req.query.referenceNumber && req.query.referenceNumber != '') {
      const refQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$referenceNumber" },
            regex: req.query.referenceNumber,
            options: "i",
          }
        }
      };
      queryToApply = { ...queryToApply, ...refQuery };
    }
    if (req.query && req.query.docNumber && req.query.docNumber !== '') {
      const poNumberQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$docNumber" },
            regex: req.query.docNumber,
            options: "i",
          }
        }
      };

      queryToApply = { ...queryToApply, ...poNumberQuery };
    }
    if (req.query.materialIds) {
      queryToApply['items.materialId'] = {
        $in: req.query.materialIds.split(',').map(id => new mongoose.Types.ObjectId(id))
      };
    }
    if (req.query.status && req.query.status != '') {
      queryToApply.status = req.query.status;
    }
    const records = await this.inventoryCountModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'addedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
        ]
      },
    );
    return records;
  }

  async findOne(
    inventoryCountId: string,
    i18n: I18nContext,
  ): Promise<InventoryCountDocument> {
    const exists = await this.inventoryCountModel.findById(inventoryCountId).populate([
      {
        path: 'items.materialId'
      }
    ]);


    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    req: any,
    inventoryCountId: string,
    dto: UpdateInventoryCountDto,
    i18n: I18nContext,
  ): Promise<InventoryCountDocument> {
    const inventoryCount = await this.inventoryCountModel.findById(
      inventoryCountId,
    );

    if (!inventoryCount) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    if (
      inventoryCount.status == InventoryCountStatus.Rejected ||
      inventoryCount.status == InventoryCountStatus.Applied
    ) {
      throw new NotFoundException(i18n.t('error.CHANGES_NOT_ALLOWED'));
    }

    if (inventoryCount.status == InventoryCountStatus.Locked) {
      throw new NotFoundException(i18n.t('error.ITEM_LOCKED'));
    }

    dto = await this.inventoryCountHelperService.prepareInventoryCountData(
      dto,
      i18n,
      req
    );
    inventoryCount.set({ ...dto });

    await inventoryCount.save();

    return inventoryCount;
  }

  async changeStatus(
    req: any,
    inventoryCountId: string,
    status: InventoryCountStatus,
    i18n: I18nContext,
  ): Promise<InventoryCountDocument> {
    const inventoryCount = await this.inventoryCountModel.findById(
      inventoryCountId,
    );

    if (!inventoryCount) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    if (
      inventoryCount.status == InventoryCountStatus.Rejected ||
      inventoryCount.status == InventoryCountStatus.Applied
    ) {
      throw new NotFoundException(i18n.t('error.CHANGES_NOT_ALLOWED'));
    }

    if (status == InventoryCountStatus.Applied) {
      await this.inventoryHelperService.applyInventoryCount(inventoryCount);

      for (let i = 0; i < inventoryCount.items.length; i++) {
        const el = inventoryCount.items[i];
        let additional: any = {}

        if (el.totalCount > el.onHandCount) {
          additional = {
            totalICQtyGain: el.totalCount - el.onHandCount,
            totalICValueGain: el.countValue - el.onHandCountValue,
            totalICCountGain: 1,
            totalICQtyLoss: 0,
            totalICValueLoss: 0,
            totalICCountLoss: 0,
          }
        } else {
          additional = {
            totalICQtyLoss: el.onHandCount - el.totalCount,
            totalICValueLoss: el.onHandCountValue - el.countValue,
            totalICCountLoss: 1,
            totalICQtyGain: 0,
            totalICValueGain: 0,
            totalICCountGain: 0
          }
        }

        await this.inventoryHelperService.saveInventoryControl(req,
          {
            restaurantId: inventoryCount.restaurantId,
            materialId: el.materialId,
            invCount: el.totalCount,
            invCountValue: el.countValue,
            ...additional
          });
      }

    }
    const timezone = TIMEZONE;
    let _currentDate = new Date();
    _currentDate.setUTCHours(0);
    _currentDate.setUTCMinutes(59);
    _currentDate = new Date(_currentDate.toLocaleString('en', { timeZone: timezone }));

    inventoryCount.status = status;
    inventoryCount.statusDate = _currentDate;


    await inventoryCount.save();


    return inventoryCount;
  }

  async remove(inventoryCountId: string, i18n: I18nContext): Promise<boolean> {
    const inventoryCount = await this.inventoryCountModel.findByIdAndDelete(
      inventoryCountId,
    );

    if (!inventoryCount) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }
}
