import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  AddSupplierDto,
  AssignPackageDto,
  SupplierQueryDto,
  UpdateSupplierDto,
  UpdateSupplierMarketPlacesDto,
  VendoryQueryDto,
} from './Supplier.dto';
import { Supplier, SupplierDocument } from './schemas/suppliers.schema';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { STATUS_MSG } from 'src/core/Constants/status-message.constants';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import {
  MenuAddition,
  MenuAdditionDocument,
} from 'src/menu/schemas/menu-addition.schema';
import { Package, PackageDocument } from 'src/package/schemas/package.schema';
import {
  SupplierPackage,
  SupplierPackageDocument,
} from './schemas/supplier-package.schema';
import * as moment from 'moment';
import { SupplierAggregated } from './interfaces/suppliers.interface';
import { TestDataService } from 'src/test-data/test-data.service';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { CacheService } from 'src/cache/cache.service';
import { CacheDataService } from 'src/cache/cache-data.service';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
    @InjectModel(Supplier.name)
    private supplierModelPag: PaginateModel<SupplierDocument>,
    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(MenuAddition.name)
    private menuAdditionModel: Model<MenuAdditionDocument>,
    @InjectModel(Package.name)
    private packageModel: Model<PackageDocument>,
    @InjectModel(SupplierPackage.name)
    private supplierPackagemodel: Model<SupplierPackageDocument>,
    @Inject(forwardRef(() => TestDataService))
    private readonly testDataService: TestDataService,
    private readonly cacheService: CacheService,
    private readonly cacheDataService: CacheDataService,
  ) {}

  async createSupplier(
    req: any,
    supplierDetails: AddSupplierDto,
  ): Promise<SupplierDocument> {
    if (supplierDetails.alias) {
      const exist = await this.supplierModel.count({
        alias: supplierDetails.alias,
      });
      if (exist > 0) {
        throw new BadRequestException(VALIDATION_MESSAGES.SameAlias.key);
      }
    }
    if (supplierDetails.domain) {
      const exist = await this.supplierModel.count({
        domain: supplierDetails.domain,
      });
      if (exist > 0) {
        throw new BadRequestException(VALIDATION_MESSAGES.SameDomain.key);
      }
    }
    const supplier = new this.supplierModel(supplierDetails);

    await supplier.save();
    this.postSupplierCreate(req, supplier, supplierDetails);
    return supplier;
  }

  async postSupplierCreate(
    req,
    supplier: SupplierDocument,
    dto: AddSupplierDto,
  ) {
    this.assignPackage(req, supplier._id, {
      packageId: null,
      startTrial: true,
    });
    if (req && dto.createTestData) {
      this.testDataService.run(req, supplier);
    }
  }

  async getAll(
    query: SupplierQueryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<SupplierDocument>> {
    let criteria: any = { ...query, deletedAt: null };
    if (query.name) {
      const name = query.name;
      delete query.name;
      criteria = {
        ...query,
        deletedAt: null,
        $expr: {
          $regexMatch: {
            input: '$name',
            regex: name,
            options: 'i',
          },
        },
      };
    }
    return await this.supplierModelPag.paginate(criteria, {
      sort: DefaultSort,
      lean: true,
      ...paginateOptions,
      ...pagination,
    });
  }

  async getAllVendors(
    query: VendoryQueryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<SupplierDocument>> {
    let criteria: any = { ...query, isVendor: true, deletedAt: null };
    if (query.name) {
      const name = query.name;
      delete query.name;
      criteria = {
        ...query,
        isVendor: true,
        deletedAt: null,
        $expr: {
          $regexMatch: {
            input: '$name',
            regex: name,
            options: 'i',
          },
        },
      };
    }
    return await this.supplierModelPag.paginate(criteria, {
      sort: DefaultSort,
      lean: true,
      ...paginateOptions,
      ...pagination,
    });
  }

  async getOne(supplierId: string): Promise<SupplierDocument> {
    let supplier = await this.cacheService.get(supplierId);
    if (!supplier) {
      supplier = await this.supplierModel.findOne({ _id: supplierId });
      if (supplier)
        await this.cacheService.set(supplierId, supplier.toObject());
    }
    return supplier;
  }

  async getAggregatedOne(
    supplierId: string,
  ): Promise<SupplierAggregated | any> {
    return await this.supplierModel.aggregate(
      [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(supplierId),
            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: 'paymentsetups',
            localField: '_id',
            foreignField: 'supplierId',
            as: 'paymentsetups',
          },
        },
        {
          $lookup: {
            from: 'supplierpackages',
            let: {
              id: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$supplierId', '$$id'],
                  },
                  active: true,
                },
              },
            ],
            as: 'package',
          },
        },
        {
          $addFields: {
            package: { $first: '$package' },
          },
        },
        {
          $lookup: {
            from: 'restaurants',
            let: {
              id: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$supplierId', '$$id'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'kitchenqueues',
                  localField: '_id',
                  foreignField: 'restaurantId',
                  as: 'kitchenqueues',
                },
              },
              {
                $lookup: {
                  from: 'cashiers',
                  localField: '_id',
                  foreignField: 'restaurantId',
                  as: 'cashiers',
                },
              },
              {
                $addFields: {
                  totalKitchens: { $size: '$kitchenqueues' },
                  totalCashiers: { $size: '$cashiers' },
                },
              },
            ],
            as: 'restaurants',
          },
        },
        {
          $addFields: {
            totalRestaurants: { $size: '$restaurants' },
            totalPaymentsetups: { $size: '$paymentsetups' },
          },
        },
      ],
      { allowDiskUse: true },
    );
  }

  async getByDomain(domain: string): Promise<SupplierDocument> {
    let supplier = await this.cacheService.get(domain);
    if (!supplier) {
      supplier = await this.supplierModel
        .findOne({ domain }, { bankDetais: 0, subscriptionDetails: 0 })
        .lean();
      if (supplier) await this.cacheService.set(domain, supplier);
    }
    return supplier;
  }

  async isDomainAvailableToUse(domain: string): Promise<boolean> {
    const supplier = await this.supplierModel.findOne({ domain });
    return supplier ? false : true;
  }

  async update(
    supplierId: string,
    supplierDetails: UpdateSupplierDto,
  ): Promise<Supplier> {
    if (supplierDetails.domain) {
      const isExist = await this.supplierModel.count({
        _id: { $ne: supplierId },
        domain: supplierDetails.domain,
      });
      if (isExist > 0)
        throw new BadRequestException(VALIDATION_MESSAGES.DomainNotAllowed.key);
    }
    if (supplierDetails.alias) {
      const exist = await this.supplierModel.count({
        alias: supplierDetails.alias,
        _id: { $ne: supplierId },
      });
      if (exist > 0) {
        throw new BadRequestException(VALIDATION_MESSAGES.SameAlias.key);
      }
    }
    const supplier = await this.supplierModel.findByIdAndUpdate(
      { _id: supplierId },
      { ...supplierDetails },
      { new: true },
    );
    if (supplierDetails.taxEnabled != supplier.taxEnabled) {
      await this.menuItemModel.updateMany(
        { supplierId: supplier._id },
        { taxEnabled: supplierDetails.taxEnabled },
      );
      await this.menuAdditionModel.updateMany(
        { supplierId: supplier._id },
        { taxEnabled: supplierDetails.taxEnabled },
      );
    }
    await this.cacheService.set(supplier.domain, supplier.toObject());
    this.cacheDataService.cacheSupplier(supplierId);
    return supplier;
  }

  async assignPackage(req: any, supplierId: string, dto: AssignPackageDto) {
    let packageCriteria: any = { isDefaultPackage: true };
    if (dto.packageId) {
      packageCriteria = { _id: dto.packageId };
    }
    const packageObj = await this.packageModel.findOne(packageCriteria);
    if (!packageObj) {
      throw new BadRequestException(VALIDATION_MESSAGES.PackageNotFound.key);
    }
    if (dto.startTrial && packageObj.trialPeriod == 0) {
      throw new BadRequestException(VALIDATION_MESSAGES.NoTrialPeriod.key);
    }
    return await this.createSupplierPackage(req, packageObj, supplierId, dto);
  }

  async createSupplierPackage(
    req: any,
    packageObj: PackageDocument,
    supplierId: string,
    dto: AssignPackageDto,
  ) {
    const startDate =
      dto.startDate ?? new Date(moment.utc().format('YYYY-MM-DD'));
    let dates: any = {
      subscriptionStartingDate: startDate,
      subscriptionExpiryDate: moment
        .utc(startDate)
        .add(packageObj.days, 'd')
        .format('YYYY-MM-DD'),
      subscriptionExpiryDateWithGrace: moment
        .utc(startDate)
        .add(packageObj.days + packageObj.gracePeriod, 'd')
        .format('YYYY-MM-DD'),
    };
    if (dto.startTrial) {
      dates = {
        trialPeriodStartingDate: startDate,
        trialPeriodExpiryDate: moment
          .utc(startDate)
          .add(packageObj.trialPeriod, 'd')
          .format('YYYY-MM-DD'),
      };
    }

    const packageObjToApply = packageObj.toObject();
    delete packageObjToApply._id;
    delete packageObjToApply.createdAt;
    delete packageObjToApply.updatedAt;
    const requestDto = dto;
    delete requestDto.packageId;
    const supplierPackage = await this.supplierPackagemodel.create({
      supplierId,
      packageId: packageObj._id,
      ...packageObjToApply,
      ...dates,
      ...requestDto,
      addedBy: req ? req?.user?.userId : null,
    });
    if (supplierPackage) {
      await this.supplierPackagemodel.findOneAndUpdate(
        {
          supplierId,
          _id: { $ne: supplierPackage._id },
          active: true,
        },
        { active: false },
      );
    }
    return supplierPackage;
  }

  async delete(supplierId: string): Promise<Supplier> {
    return await this.supplierModel.findByIdAndUpdate(
      { _id: supplierId },
      { deletedAt: new Date() },
    );
  }

  async getSupplierActivePackage(supplierId: string) {
    return await this.supplierPackagemodel.findOne({
      supplierId,

      active: true,
    });
  }

  async updateMarketPlaces(
    supplierId: string,
    market: UpdateSupplierMarketPlacesDto,
  ): Promise<Supplier> {
    if (supplierId) {
      const isExist = await this.supplierModel.findOne({ _id: supplierId });
      if (!isExist)
        throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound);
    }
    const supplier = await this.supplierModel.findByIdAndUpdate(
      { _id: supplierId },
      { ...market },
      { new: true, upsert: true },
    );
    return supplier;
  }
}
