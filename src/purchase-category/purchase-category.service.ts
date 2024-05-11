import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePurchaseCategoryDto } from './dto/create-purchase-category.dto';
import { UpdatePurchaseCategoryDto } from './dto/update-purchase-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PurchaseCategory,
  PurchaseCategoryDocument,
} from './schemas/purchase-category.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class PurchaseCategoryService {
  constructor(
    @InjectModel(PurchaseCategory.name)
    private readonly purchaseCategoryModel: Model<PurchaseCategoryDocument>,
    @InjectModel(PurchaseCategory.name)
    private readonly purchaseCategoryModelPag: PaginateModel<PurchaseCategoryDocument>,
  ) {}

  async create(
    req: any,
    dto: CreatePurchaseCategoryDto,
  ): Promise<PurchaseCategoryDocument> {
    return await this.purchaseCategoryModel.create({
      ...dto,

      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PurchaseCategoryDocument>> {
    const purchaseCategorys = await this.purchaseCategoryModelPag.paginate(
      { supplierId: req.user.supplierId },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return purchaseCategorys;
  }

  async findOne(purchaseCategoryId: string): Promise<PurchaseCategoryDocument> {
    const exists = await this.purchaseCategoryModel.findById(
      purchaseCategoryId,
    );

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    purchaseCategoryId: string,
    dto: UpdatePurchaseCategoryDto,
  ): Promise<PurchaseCategoryDocument> {
    const purchaseCategory = await this.purchaseCategoryModel.findByIdAndUpdate(
      purchaseCategoryId,
      dto,
      {
        new: true,
      },
    );

    if (!purchaseCategory) {
      throw new NotFoundException();
    }

    return purchaseCategory;
  }

  async remove(purchaseCategoryId: string): Promise<boolean> {
    const purchaseCategory = await this.purchaseCategoryModel.findByIdAndRemove(
      purchaseCategoryId,
    );

    if (!purchaseCategory) {
      throw new NotFoundException();
    }
    return true;
  }
}
