import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  MenuCategory,
  MenuCategoryDocument,
} from '../schemas/menu-category.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  CreateMenuCategoryDTO,
  UpdateMenuCategoryDTO,
} from '../dto/menu-category.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { QueryMenuCategoryDto } from '../dto/query-menu-category.dto';
import { MenuItem, MenuItemDocument } from '../schemas/menu-item.schema';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { CacheDataService } from 'src/cache/cache-data.service';

@Injectable()
export class MenuCategoryService {
  constructor(
    @InjectModel(MenuCategory.name)
    private readonly menuCategoryModel: Model<MenuCategoryDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(MenuCategory.name)
    private readonly menuCategoryModelPag: PaginateModel<MenuCategoryDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly cacheDataService: CacheDataService,
  ) { }

  async create(
    req: any,
    dto: CreateMenuCategoryDTO,
  ): Promise<MenuCategoryDocument> {

    const menuCat = await this.menuCategoryModel.findOneAndUpdate(
      { supplierId: req.user.supplierId, name: dto.name },
      {
        ...dto,
        addedBy: req.user.userId,
        supplierId: req.user.supplierId,
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      },
    );
    this.cacheDataService.cacheMenuCategories(req.user.supplierId);

    return menuCat;
  }

  async findAll(
    req: any,
    query: QueryMenuCategoryDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<MenuCategoryDocument>> {
    let idFilter = {};
    let queryToApply: any = {}

    let restIds: any = [];
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
      restIds = getAllRest?.restaurantId;
    }

    if (query.restaurantId) {
      if (restIds && restIds?.length > 0) {
        restIds = restIds.filter((id) => id.toString() == new mongoose.Types.ObjectId(query.restaurantId)?.toString());
        console.log("After filter restIds", restIds);
        queryToApply.restaurantId = {
          $in: restIds
        }
      }
      else {
        queryToApply.restaurantId = {
          $in: query.restaurantId
        };
      }
    }
    else if (restIds && restIds?.length > 0) {
      queryToApply.restaurantId = {
        $in: restIds
      };
    }


    const menuCategorys = await this.menuCategoryModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        deletedAt: null,
        $or: [
          { restaurantId: { $exists: false } },
          { restaurantId: [] },
          queryToApply,
        ],
        ...idFilter,
      },
      {
        sort: paginateOptions.sortBy
          ? {
            [paginateOptions.sortBy]: paginateOptions.sortDirection
              ? paginateOptions.sortDirection
              : -1,
          }
          : DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return menuCategorys;
  }

  async findOne(menuCategoryId: string): Promise<MenuCategoryDocument> {
    const exists = await this.menuCategoryModel.findById(menuCategoryId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    menuCategoryId: string,
    dto: UpdateMenuCategoryDTO,
    req: any
  ): Promise<MenuCategoryDocument> {
    const menuCategory = await this.menuCategoryModel.findByIdAndUpdate(
      menuCategoryId,
      dto,
      {
        new: true,
      },
    );

    if (!menuCategory) {
      throw new NotFoundException();
    }

    this.cacheDataService.cacheMenuCategories(req.user.supplierId)
    return menuCategory;
  }

  async remove(menuCategoryId: string): Promise<boolean> {
    const menuCategory = await this.menuCategoryModel.findByIdAndUpdate(
      menuCategoryId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!menuCategory) {
      throw new NotFoundException();
    }
    return true;
  }
}
