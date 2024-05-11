import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, PaginateModel, PaginateResult } from 'mongoose';

import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import {
  MenuAddition,
  MenuAdditionDocument,
} from '../schemas/menu-addition.schema';
import {
  CreateMenuAdditionDTO,
  UpdateMenuAdditionDTO,
} from '../dto/menu-addition.dto';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { Material, MaterialDocument } from 'src/material/schemas/material.schema';
import { CacheDataService } from 'src/cache/cache-data.service';
import Excel = require('exceljs');
import { MenuAdditions } from 'src/new-client-mgmt/constant/template.constant';

@Injectable()
export class MenuAdditionService {
  constructor(
    @InjectModel(MenuAddition.name)
    private readonly menuAdditionModel: Model<MenuAdditionDocument>,
    @InjectModel(MenuAddition.name)
    private readonly menuAdditionModelPag: PaginateModel<MenuAdditionDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    private readonly cacheDataService: CacheDataService,
  ) { }

  async create(
    req: any,
    dto: CreateMenuAdditionDTO,
  ): Promise<MenuAdditionDocument> {
    const supplier = await this.supplierModel.findById(req.user.supplierId);

    if (supplier.taxEnabled) {
      dto.taxEnabled = true;
    }


    const menuAddition = await this.menuAdditionModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });

    console.log("menuAddition.options", menuAddition.options)

    for (let i = 0; i < menuAddition?.options?.length; i++) {
      const el = menuAddition.options[i];
      console.log("elx", el);
      if (el.materialId && el.materialId != '') {
        await this.materialModel.findByIdAndUpdate(
          el.materialId,
          {
            menuAdditionId: menuAddition._id,
            menuAdditionOptionId: el._id
          },
          {
            new: true,
          },
        );
      }
    }

    if (req?.user?.supplierId)
      this.cacheDataService.cacheMenuAdditions(req.user.supplierId)
    return menuAddition;
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<MenuAdditionDocument>> {
    const menuAdditions = await this.menuAdditionModelPag.paginate(
      {
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
      },
    );
    return menuAdditions;
  }

  async findOne(menuAdditionId: string): Promise<MenuAdditionDocument> {
    const exists = await this.menuAdditionModel.findById(menuAdditionId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    menuAdditionId: string,
    dto: UpdateMenuAdditionDTO,
    req: any
  ): Promise<MenuAdditionDocument> {
    const menuAddition = await this.menuAdditionModel.findByIdAndUpdate(
      menuAdditionId,
      dto,
      {
        new: true,
      },
    );
    for (let i = 0; i < dto.options.length; i++) {
      const el = dto.options[i];
      console.log("el", el);
      if (el.materialId && el.materialId != '') {
        await this.materialModel.findByIdAndUpdate(
          el.materialId,
          {
            menuAdditionId: menuAdditionId,
            menuAdditionOptionId: el._id
          },
          {
            new: true,
          },
        );
      }

    }

    if (!menuAddition) {
      throw new NotFoundException();
    }

    if (req?.user?.supplierId)
      this.cacheDataService.cacheMenuAdditions(req.user.supplierId);
    return menuAddition;
  }

  async remove(menuAdditionId: string): Promise<boolean> {
    const menuAddition = await this.menuAdditionModel.findByIdAndUpdate(
      menuAdditionId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!menuAddition) {
      throw new NotFoundException();
    }
    return true;
  }

  async menuAdditionFileUploadProcess(req, file: Express.Multer.File) {
    file = file[0];

    const workBook = new Excel.Workbook();
    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);

    try {
      let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
        optionName: row.getCell(MenuAdditions.optionName).text,
        optionNameAr: row.getCell(MenuAdditions.optionNameAr).text,
        price: row.getCell(MenuAdditions.price).value || 0,
        calory: row.getCell(MenuAdditions.calory).text,
        orderNo: row.getCell(MenuAdditions.orderNo).value || 1,
        default: row.getCell(MenuAdditions.default).value || false,
        additionName: row.getCell(MenuAdditions.additionName).text,
        additionNameAr: row.getCell(MenuAdditions.additionName).text,
        isMultipleAllowed: row.getCell(MenuAdditions.isMultipleAllowed).value || false,
        maxOption: row.getCell(MenuAdditions.maxOption).value || 1,
        minOption: row.getCell(MenuAdditions.minOption).value || 1,
        groupId: row.getCell(MenuAdditions.groupId).value || 1
      }));


      dtoArray = dtoArray.filter((f: any) => f.additionName != '' && f.optionName != '');


      console.log("dtoArray", dtoArray);
      const newArray = [];

      dtoArray.forEach((item, index) => {
        const groupIndex = newArray.findIndex((group) => group.groupId === item.groupId);
        if (groupIndex === -1) {
          newArray.push({
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
            name: item.additionName,
            nameAr: item.additionNameAr,
            isMultipleAllowed: item.isMultipleAllowed,
            maxOptions: item.maxOption,
            minOptions: item.minOption,
            freeOptions: 0,
            order: index + 1,
            active: true,
            options: [{
              name: item.optionName,
              nameAr: item.optionNameAr,
              order: item.orderNo,
              calory: item.calory,
              active: true,
              default: item.default
            }],
          });
        }
        else {
          newArray[groupIndex].options.push(
            {
              name: item.optionName,
              nameAr: item.optionNameAr,
              order: item.orderNo,
              calory: item.calory,
              active: true,
              default: item.default
            }
          );
        }
      });

      console.log("newArray", newArray);

      if (newArray && newArray?.length > 0) {
        this.menuAdditionModel.insertMany(newArray);
      }

    } catch (err) {
      console.log("Err", err);
    }
    return true;

  }
}
