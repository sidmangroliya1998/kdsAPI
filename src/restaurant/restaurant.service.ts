import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { Cashier, CashierDocument } from 'src/cashier/schemas/cashier.schema';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModelPag: PaginateModel<RestaurantDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Cashier.name)
    private readonly cashierModel: Model<CashierDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateRestaurantDto,
    createDefaultCashier: boolean = true
  ): Promise<RestaurantDocument> {

    const restData = await this.restaurantModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });

    if (createDefaultCashier) {
      const cashierdto = {
        name: dto.name + " Cashier",
        nameAr: dto.nameAr + " CashierAr",
        restaurantId: restData?._id,
        default: true,
        active: true,

      }
      await this.cashierModel.create({
        ...cashierdto,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId,
      });
    }


    return restData;
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<RestaurantDocument>> {

    let query: any = {};
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }
    let restaurants: any = {};
    if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
      if (req.query && req.query.isMainBranch && req.query.isMainBranch) {
        query = {
          $or: [
            { _id: { $in: getAllRest.restaurantId } },
            { isMainBranch: true }
          ]
        };
      } else {
        query._id = { $in: getAllRest.restaurantId };
      }
      console.log("query", query);
      restaurants = await this.restaurantModelPag.paginate(
        query,
        {
          supplierId: req.user.supplierId,
          deletedAt: null,
          sort: DefaultSort,
          lean: true,
          ...paginateOptions,
          ...pagination,
        },
      );
    }
    else {
      restaurants = await this.restaurantModelPag.paginate(
        {
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
    }
    if (restaurants.docs && restaurants.docs?.length > 1 &&
      getAllRest && getAllRest?.defaultRestaurant && getAllRest?.defaultRestaurant != '') {
      const allexceptDefault = restaurants.docs.filter((f: any) => f._id != getAllRest?.defaultRestaurant);
      const finalArray = [];
      finalArray.push(
        restaurants.docs.find((f: any) => f._id == getAllRest?.defaultRestaurant)
      )
      for (let i = 0; i < allexceptDefault.length; i++) {
        const el = allexceptDefault[i];
        finalArray.push(el);
      }
      restaurants.docs = finalArray;
    }
    return restaurants;

  }

  async findOne(restaurantId: string): Promise<RestaurantDocument> {
    const exists = await this.restaurantModel.findById(restaurantId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    req: any,
    restaurantId: string,
    dto: UpdateRestaurantDto,
  ): Promise<RestaurantDocument> {

    if (dto.isMainBranch && dto.isMainBranch == true) {
      await this.restaurantModel.updateMany(
        {
          supplierId: req.user.supplierId
        },
        { isMainBranch: false },
      );
    }

    const restaurant = await this.restaurantModel.findByIdAndUpdate(
      restaurantId,
      dto,
      { new: true },
    );

    if (!restaurant) {
      throw new NotFoundException();
    }

    return restaurant;
  }

  async remove(restaurantId: string): Promise<boolean> {
    const restaurant = await this.restaurantModel.findByIdAndUpdate(
      restaurantId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!restaurant) {
      throw new NotFoundException();
    }
    return true;
  }

  async findAllRestaurantForSuperAdmin(req) {

    return await this.restaurantModel.find(
      {
        supplierId: req.query.supplierId,
        deletedAt: null,
      }
    );
  }
}
