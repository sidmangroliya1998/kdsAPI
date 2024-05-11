import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import Excel = require('exceljs');
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import {
  HideFromMarket,
  MenuItem,
  MenuItemDocument,
} from '../schemas/menu-item.schema';
import {
  CreateMenuItemDTO,
  HideFromMarketDto,
  UpdateMenuItemDTO,
} from '../dto/menu-item.dto';
import { QueryMenuItemDto } from '../dto/query-menu-item.dto';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { MenuCategory, MenuCategoryDocument } from '../schemas/menu-category.schema';
import { MenuItemTemplate } from 'src/new-client-mgmt/constant/template.constant';
import { copySupplierDTO } from '../dto/copy-supplier.dto';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModelPag: PaginateModel<MenuItemDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(MenuCategory.name)
    private readonly menuCategoryModel: Model<MenuCategoryDocument>,
  ) { }

  async create(req: any, dto: CreateMenuItemDTO): Promise<MenuItemDocument> {
    if (dto.taxEnabled !== true && dto.taxEnabled !== false) {
      const supplier = await this.supplierModel.findById(req.user.supplierId);
      dto.taxEnabled = supplier.taxEnabled ?? false;
    }
    if (dto.importId) {
      return await this.menuItemModel.findOneAndUpdate(
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
    }
    return await this.menuItemModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAllMenu(req: any,
    query: QueryMenuItemDto,
    paginateOptions: PaginationDto): Promise<PaginateResult<MenuItemDocument>> {
    let queryObj: any = {};
    let queryToApply: any = {};
    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (query.restaurantId) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: [] },
          { restaurantId: { $exists: false } },
          { restaurantId: { $in: getAllRest?.restaurantId } },
          { restaurantId: { $in: [new mongoose.Types.ObjectId(query.restaurantId)] } }
        ];
      } else {
        queryToApply.$or = [
          { restaurantId: [] },
          { restaurantId: { $exists: false } },
          { restaurantId: { $in: [new mongoose.Types.ObjectId(query.restaurantId)] } }
        ];
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { restaurantId: [] },
          { restaurantId: { $exists: false } },
          { restaurantId: { $in: getAllRest?.restaurantId } }
        ];
      }
    }


    const menuCategory = await this.menuCategoryModel.find(
      {
        supplierId: req.user.supplierId,
        deletedAt: null,
        ...queryToApply
      });

    if (menuCategory) {
      if (query.categoryId) {
        queryObj.categoryId = {
          $in: menuCategory.filter((f: any) => f._id == query.categoryId).map((mi) => {
            return mi._id;
          })
        }
      } else {
        queryObj.categoryId = {
          $in: menuCategory.map((mi) => {
            return mi._id;
          })
        }
      }
    }
    if (queryObj.restaurantId) {
      delete queryObj.restaurantId
    }

    if (query.restaurantId) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryObj.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(query.restaurantId)] } }
        ];
      } else {
        queryObj.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(query.restaurantId)] } }
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

    let searchObj: any = {};
    if (query.search) {
      searchObj.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { nameAr: { $regex: query.search, $options: 'i' } },
      ];
    }
    const menuItems = await this.menuItemModelPag.paginate(
      {
        ...queryObj,
        ...searchObj,
        supplierId: req.user.supplierId,
        deletedAt: null,
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
        populate: [
          {
            path: 'uomSell',
          },
          {
            path: 'promotionalGroupedItems.item',
          },
          {
            path: 'revenueCode'
          },
          {
            path: 'categoryId'
          }
        ],
      },
    );

    let resp = [];
    if (query.isOrderMenu) {
      for (let i = 0; i < menuItems?.docs?.length; i++) {
        const elx = menuItems?.docs[i];
        let Newprice = elx.price;
        if ((elx?.availableRestaurants && elx?.availableRestaurants?.length > 0 &&
          elx?.availableRestaurants?.find((f: any) => f.toString() === new mongoose.Types.ObjectId(query.restaurantId).toString()))
          || !elx?.availableRestaurants || elx?.availableRestaurants?.length == 0) {
          if (elx.restaurantPrice && elx?.restaurantPrice?.length > 0) {
            const restMenuPrice = elx?.restaurantPrice?.find((f: any) => f.restaurantId == query.restaurantId);
            if (restMenuPrice) {
              Newprice = restMenuPrice?.cost;
            }
            resp.push({
              ...elx,
              price: Newprice
            });
          }
          else {
            resp.push(elx);
          }
        }
      }

      if (resp && resp?.length > 0) {
        menuItems.docs = resp;
      }
    }

    return menuItems;
  }

  async findAll(
    req: any,
    query: QueryMenuItemDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<MenuItemDocument>> {
    const queryObj: any = { ...query };
    if (query.search) {
      queryObj.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { nameAr: { $regex: query.search, $options: 'i' } },
      ];
    }

    let queryToApply: any = {}

    let getAllRest: any = [];
    if (req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }
    if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
      queryToApply.restaurantId = {
        $in: getAllRest?.restaurantId
      };
    }
    let restId = ''
    if (query.restaurantId) {
      if (query.isOrderMenu) {
        restId = query.restaurantId;
        delete queryObj.restaurantId
      }
      else {
        queryObj.$or = [
          { restaurantId: { $exists: false } },
          { restaurantId: query.restaurantId }
        ]
      }
    }

    let catFilter: any = {};

    if (query.categoryId) {
      catFilter._id = query.categoryId
    }
    const menuCategory = await this.menuCategoryModel.find(
      {
        supplierId: req.user.supplierId,
        deletedAt: null,
        ...catFilter,
        $or: [
          { restaurantId: { $exists: false } },
          queryToApply,
        ]
      });


    if (menuCategory) {
      queryObj.categoryId = {
        $in: menuCategory.map((mi) => {
          return mi._id;
        })
      }
    }
    console.log("queryObj", queryObj);

    const menuItems = await this.menuItemModelPag.paginate(
      {
        ...queryObj,
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
            path: 'uomSell',
          },
          {
            path: 'promotionalGroupedItems.item',
          },
          {
            path: 'revenueCode'
          }
        ],
      },
    );
    let resp = [];
    if (query.isOrderMenu) {
      for (let i = 0; i < menuItems?.docs?.length; i++) {
        const elx = menuItems?.docs[i];
        let Newprice = elx.price;
        if ((elx?.availableRestaurants && elx?.availableRestaurants?.length > 0 &&
          elx?.availableRestaurants?.find((f: any) => f.toString() === new mongoose.Types.ObjectId(restId).toString()))
          || !elx?.availableRestaurants || elx?.availableRestaurants?.length == 0) {
          if (elx.restaurantPrice && elx?.restaurantPrice?.length > 0) {
            const restMenuPrice = elx?.restaurantPrice?.find((f: any) => f.restaurantId == restId);
            if (restMenuPrice) {
              Newprice = restMenuPrice?.cost;
            }
            resp.push({
              ...elx,
              price: Newprice
            });
          }
          else {
            resp.push(elx);
          }
        }
      }

      if (resp && resp?.length > 0) {
        menuItems.docs = resp;
      }
    }


    return menuItems;
  }

  async findOne(req: any, menuItemId: string): Promise<MenuItemDocument> {
    const exists = await this.menuItemModel
      .findById(menuItemId)
      .populate([{ path: 'additions', match: { deletedAt: null } }, { path: 'revenueCode' }]);
    if (req?.query && req?.query?.restaurantId) {

      if (exists?.restaurantPrice && exists?.restaurantPrice?.length > 0) {
        const restMenuPrice = exists?.restaurantPrice?.find((f: any) => f.restaurantId == req?.query?.restaurantId);
        if (restMenuPrice) {
          exists.price = restMenuPrice?.cost;
        }

      }
    }

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    menuItemId: string,
    dto: UpdateMenuItemDTO,
  ): Promise<MenuItemDocument> {
    const menuItem = await this.menuItemModel.findByIdAndUpdate(
      menuItemId,
      dto,
      {
        new: true,
      },
    );

    if (!menuItem) {
      throw new NotFoundException();
    }

    return menuItem;
  }

  async remove(menuItemId: string): Promise<boolean> {
    const menuItem = await this.menuItemModel.findByIdAndUpdate(
      menuItemId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!menuItem) {
      throw new NotFoundException();
    }
    return true;
  }


  async menuFileUploadProcess(req, file: Express.Multer.File) {
    file = file[0];

    const workBook = new Excel.Workbook();
    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);

    const menuCategory = await this.menuCategoryModel.find({
      supplierId: req.user.supplierId,
      deletedAt: null,
    });


    try {
      let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
        name: row.getCell(MenuItemTemplate.name).text,
        nameAr: row.getCell(MenuItemTemplate.nameAr).text,
        description: row.getCell(MenuItemTemplate.description).text,
        descriptionAr: row.getCell(MenuItemTemplate.descriptionAr).text,
        categoryId: menuCategory.find((f: any) => f.name?.trim() ===
          row.getCell(MenuItemTemplate.categoryId).text?.trim() ||
          f.nameAr.trim() === row.getCell(MenuItemTemplate.categoryId).text?.trim()),
        price: row.getCell(MenuItemTemplate.price).value || 0,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId
      }));

      dtoArray = dtoArray.filter((f: any) => f.name != '' && f.categoryId != '' && f.price != null);
      this.menuItemModel.insertMany(dtoArray);
    } catch (err) {
      console.log("Err", err);
    }
    return true;
  }

  async copySupplier(req: any, dto: copySupplierDTO) {
    const tosupplier = await this.supplierModel.findById(dto.toSupplier);
    if (!tosupplier) throw new NotFoundException('To Supplier not found');
    let newMenuCategory: any, newMenuItem: any;

    const menuItemsIds = dto.menuItemIds.map(id => new mongoose.Types.ObjectId(id));

    //find all menu Items
    const menuItems = await this.menuItemModel.find({ _id: { $in: menuItemsIds } }).select('-createdAt -updatedAt -deletedAt')
      .populate({ path: 'categoryId', select: '-createdAt -deletedAt -updatedAt -importId' });

    await Promise.all(menuItems.map(async (menuItem) => {
      let oldMenuItem = menuItem.toJSON();

      oldMenuItem.categoryId.addedBy = req.user.userId;
      oldMenuItem.categoryId.supplierId = tosupplier._id;
      delete oldMenuItem.categoryId._id;
      oldMenuItem.categoryId.printerId = null;
      oldMenuItem.addedBy = req.user.userId;
      let existCategory = await this.menuCategoryModel.findOne({ name: oldMenuItem.categoryId.name, supplierId: tosupplier._id });
      if (!existCategory) {
        newMenuCategory = await this.menuCategoryModel.create(oldMenuItem.categoryId);
      } else newMenuCategory = existCategory;

      delete oldMenuItem.categoryId;
      oldMenuItem.categoryId = newMenuCategory._id;
      oldMenuItem.supplierId = tosupplier._id;
      delete oldMenuItem._id;
      let existMenuItem = await this.menuItemModel.findOne({ name: oldMenuItem.name, supplierId: tosupplier._id })
      if (!existMenuItem) newMenuItem = await this.menuItemModel.create(oldMenuItem);
      else newMenuItem = existMenuItem;
    }));
    return true;
  }
}
