import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { I18nContext } from 'nestjs-i18n';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { MongooseQueryParser } from 'mongoose-query-parser';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(Vendor.name)
    private readonly vendorModelPag: PaginateModel<VendorDocument>,
  ) { }

  async create(req: any, dto: CreateVendorDto): Promise<VendorDocument> {
    return await this.vendorModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    query: QueryVendorDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<VendorDocument>> {
    let queryToApply: any = {};
    // if (query.filter) {
    //   //delete queryToApply.filter;
    //   const parser = new MongooseQueryParser();
    //   const parsed = parser.parse(`${query.filter}`);
    //   queryToApply = { ...queryToApply, ...parsed.filter };
    // }
    if (req.query.search && req.query.search != '') {
      queryToApply.$or = [
        {
          name: { $regex: req.query.search, $options: 'i' }
        },
        {
          nameAr: { $regex: req.query.search, $options: 'i' }
        },
        {
          phoneNumber: { $regex: req.query.search, $options: 'i' }
        },
        {
          email: { $regex: req.query.search, $options: 'i' }
        },
        {
          contactPerson: { $regex: req.query.search, $options: 'i' }
        }
      ];
    }
    if (req.query.vatNumber && req.query.vatNumber != '') {
      const vatNumberSearch = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$vatNumber" },
            regex: req.query.vatNumber,
            options: "i",
          }
        }
      };
      queryToApply = { ...queryToApply, ...vatNumberSearch };
    }
    const vendors = await this.vendorModelPag.paginate(
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
      },
    );
    return vendors;
  }

  async findOne(vendorId: string, i18n: I18nContext): Promise<VendorDocument> {
    const exists = await this.vendorModel.findById(vendorId)

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async update(
    vendorId: string,
    dto: UpdateVendorDto,
    i18n: I18nContext,
  ): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findByIdAndUpdate(vendorId, dto, {
      new: true,
    });

    if (!vendor) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return vendor;
  }

  async remove(vendorId: string, i18n: I18nContext): Promise<boolean> {
    const vendor = await this.vendorModel.findByIdAndUpdate(
      vendorId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!vendor) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }
}
