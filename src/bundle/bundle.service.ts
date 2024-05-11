import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { Bundle, BundleDocument } from './schemas/bundle.schema';
import { DefaultSort, PaginationDto } from 'src/core/Constants/pagination';
import { pagination } from '../core/Constants/pagination';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import * as moment from 'moment';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class BundleService {
  constructor(
    @InjectModel(Bundle.name)
    private readonly bundleModel: Model<BundleDocument>,
    @InjectModel(Bundle.name)
    private readonly bundleModelPag: PaginateModel<BundleDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(req: any, dto: CreateBundleDto): Promise<BundleDocument> {
    return await this.bundleModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<BundleDocument>> {
    let queryObj: any = {};
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (req.query.restaurantId) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryObj.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(req.query.restaurantId)] } }
        ];
      } else {
        queryObj.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(req.query.restaurantId)] } }
        ];
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryObj.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } }
        ];
      }
    }

    queryObj.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];

    const bundles = await this.bundleModelPag.paginate(
      { supplierId: req.user.supplierId, ...queryObj },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );

    bundles.docs.forEach((b) => {
      if (b.offerValidity) {
        const fromArr = b.offerValidity?.validTime?.startTime?.split(':');
        const toArr = b.offerValidity?.validTime?.endTime?.split(':');
        const startDate = moment(b.offerValidity.startDate)
          .tz(TIMEZONE)
          .set({
            hour: fromArr?.length == 2 ? parseInt(fromArr[0]) : 0,
            minute: fromArr?.length == 2 ? parseInt(fromArr[1]) : 0,
          });

        const endDate = moment(b.offerValidity.endDate)
          .tz(TIMEZONE)
          .set({
            hour: toArr?.length == 2 ? parseInt(toArr[0]) : 0,
            minute: toArr?.length == 2 ? parseInt(toArr[1]) : 0,
          });
        const currentDate = moment().tz(TIMEZONE);
        console.log(startDate, endDate, currentDate);
        b.isValid = false;
        if (
          currentDate.isSameOrAfter(startDate) &&
          currentDate.isSameOrBefore(endDate)
        ) {
          b.isValid = true;
        }
      }
    });
    return bundles;
  }

  async findOne(bundleId: string): Promise<BundleDocument> {
    const exists = await this.bundleModel.findById(bundleId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    req,
    bundleId: string,
    dto: UpdateBundleDto,
  ): Promise<BundleDocument> {
    const bundle = await this.bundleModel.findByIdAndUpdate(bundleId, dto, {
      new: true,
    });

    if (!bundle) {
      throw new NotFoundException();
    }

    return bundle;
  }

  async remove(bundleId: string): Promise<boolean> {

    const bundle = await this.bundleModel.findByIdAndUpdate(
      bundleId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!bundle) {
      throw new NotFoundException();
    }
    return true;
  }
}
