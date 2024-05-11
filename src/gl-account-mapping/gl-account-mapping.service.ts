import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGlAccountMappingDto } from './dto/create-gl-account-mapping.dto';
import { UpdateGlAccountMappingDto } from './dto/update-gl-account-mapping.dto';
import { InjectModel } from '@nestjs/mongoose';

import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  GlAccountMapping,
  GlAccountMappingDocument,
} from './schemas/gl-account-mapping.schema';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class GlAccountMappingService {
  constructor(
    @InjectModel(GlAccountMapping.name)
    private readonly glAccountMappingModel: Model<GlAccountMappingDocument>,
    @InjectModel(GlAccountMapping.name)
    private readonly glAccountMappingModelPag: PaginateModel<GlAccountMappingDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateGlAccountMappingDto,
  ): Promise<GlAccountMappingDocument> {
    return await this.glAccountMappingModel.findOneAndUpdate(
      {
        supplierId: req.user.supplierId,
      },
      {
        ...dto,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId,
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      },
    );
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountMappingDocument>> {
    const glAccountMappings = await this.glAccountMappingModelPag.paginate(
      { supplierId: req.user.supplierId },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'cash.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'bank.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'card.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'online.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'softPos.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'deferred.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'accountReceivable.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'crRevenue.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'crShishaTax.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'crOutputTax.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'drInputTax.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'wasteExpense.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'sfInterCompany.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'cogsAccount.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'customerAccountReceivables.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'taxClearing.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'gainAndLoss.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'avgPriceChange.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'salaryExpense.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'salaryAccural.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'employeeExpense.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'purchaseCategories.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'materialCodes.invengtoryGlAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'materialCodes.grirGlAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'consumptionGlAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'glVenCodes.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'glRevenueCodes.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
          {
            path: 'glTaxIndicationCodes.glAccount',
            select: {
              name: 1,
              nameAr: 1,
            },
          },
        ],
      },
    );
    return glAccountMappings;
  }

  async findOne(glAccountMappingId: string): Promise<GlAccountMappingDocument> {
    const exists = await this.glAccountMappingModel
      .findById(glAccountMappingId)
      .populate([
        {
          path: 'cash.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'bank.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'card.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'online.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'softPos.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'deferred.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'accountReceivable.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'crRevenue.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'crShishaTax.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'crOutputTax.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'drInputTax.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'wasteExpense.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'sfInterCompany.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'cogsAccount.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'customerAccountReceivables.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'taxClearing.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'gainAndLoss.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'purchaseCategories.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'materialCodes.invengtoryGlAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'materialCodes.grirGlAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'glVenCodes.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'glRevenueCodes.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
        {
          path: 'glTaxIndicationCodes.glAccount',
          select: {
            name: 1,
            nameAr: 1,
          },
        },
      ]);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    glAccountMappingId: string,
    dto: UpdateGlAccountMappingDto,
  ): Promise<GlAccountMappingDocument> {
    const glAccountMapping = await this.glAccountMappingModel.findByIdAndUpdate(
      glAccountMappingId,
      dto,
      {
        new: true,
      },
    );

    if (!glAccountMapping) {
      throw new NotFoundException();
    }

    return glAccountMapping;
  }

  async remove(glAccountMappingId: string): Promise<boolean> {
    const glAccountMapping = await this.glAccountMappingModel.findByIdAndRemove(
      glAccountMappingId,
    );

    if (!glAccountMapping) {
      throw new NotFoundException();
    }
    return true;
  }
}
