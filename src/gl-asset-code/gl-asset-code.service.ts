import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { GlAssetCode, GlAssetCodeDocument } from './schemas/create-gl-asset.schema';
import { CreateGlAssetCodeDto } from './dto/create-gl-asset-code.dto';
import { UpdateGlAssetCodeDto } from './dto/update-gl-asset-code.dto';

@Injectable()
export class GlAssetCodeService {
    constructor(
        @InjectModel(GlAssetCode.name)
        private readonly GlAssetCodeModel: Model<GlAssetCodeDocument>,
        @InjectModel(GlAssetCode.name)
        private readonly GlAssetCodeModelPag: PaginateModel<GlAssetCodeDocument>,
    ) { }

    async create(
        req: any,
        dto: CreateGlAssetCodeDto,
    ): Promise<GlAssetCodeDocument> {
        return await this.GlAssetCodeModel.create({
            ...dto,

            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlAssetCodeDocument>> {
        const GlAssetCodes = await this.GlAssetCodeModelPag.paginate(
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
                ]
            },
        );
        return GlAssetCodes;
    }

    async findOne(GlAssetCodeId: string): Promise<GlAssetCodeDocument> {
        const exists = await this.GlAssetCodeModel.findById(GlAssetCodeId);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        GlAssetCodeId: string,
        dto: UpdateGlAssetCodeDto,
    ): Promise<GlAssetCodeDocument> {
        const GlAssetCode = await this.GlAssetCodeModel.findByIdAndUpdate(
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
        const GlAssetCode = await this.GlAssetCodeModel.findByIdAndRemove(
            GlAssetCodeId,
        );

        if (!GlAssetCode) {
            throw new NotFoundException();
        }
        return true;
    }
}
