import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { AssetCategory, AssetCategoryDocument } from './schemas/asset-cat.schema';
import { CreateAssetCategoryDto } from './dto/create-asset-cat.dto';
import { UpdateAssetCategoryDto } from './dto/update-asset-cat.dto';

@Injectable()
export class AssetCategoryService {
    constructor(
        @InjectModel(AssetCategory.name)
        private readonly assetCategoryModel: Model<AssetCategoryDocument>,
        @InjectModel(AssetCategory.name)
        private readonly assetCategoryModelPag: PaginateModel<AssetCategoryDocument>,
    ) { }

    async create(
        req: any,
        dto: CreateAssetCategoryDto,
    ): Promise<AssetCategoryDocument> {
        return await this.assetCategoryModel.create({
            ...dto,

            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetCategoryDocument>> {
        const GlAssetCodes = await this.assetCategoryModelPag.paginate(
            { supplierId: req.user.supplierId },
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
                        path: 'glAssetCodeId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            _id: 1,
                        },
                    }
                ]
            },
        );
        return GlAssetCodes;
    }

    async findOne(GlAssetCodeId: string): Promise<AssetCategoryDocument> {
        const exists = await this.assetCategoryModel.findById(GlAssetCodeId);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        GlAssetCodeId: string,
        dto: UpdateAssetCategoryDto,
    ): Promise<AssetCategoryDocument> {
        const GlAssetCode = await this.assetCategoryModel.findByIdAndUpdate(
            GlAssetCodeId,
            dto,
            {
                new: true,
            },
        );

        if (!GlAssetCode) {
            throw new NotFoundException();
        }

        return GlAssetCode;
    }

    async remove(GlAssetCodeId: string): Promise<boolean> {
        const GlAssetCode = await this.assetCategoryModel.findByIdAndRemove(
            GlAssetCodeId,
        );

        if (!GlAssetCode) {
            throw new NotFoundException();
        }
        return true;
    }
}
