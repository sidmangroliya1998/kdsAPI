import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { UpdateGlRevenueCodeDto } from './dto/update-gl-revenue-code.dto';
import { GlRevenueCode, GlRevenueCodeDocument } from './schemas/gl-revenue-code.schema';
import { CreateGlRevenueCodeDto } from './dto/create-gl-revenue-code.dto';

@Injectable()
export class GlRevenueCodeService {
    constructor(
        @InjectModel(GlRevenueCode.name)
        private readonly glRevenueCodeModel: Model<GlRevenueCodeDocument>,
        @InjectModel(GlRevenueCode.name)
        private readonly glRevenueCodeModelPag: PaginateModel<GlRevenueCodeDocument>,
    ) { }

    async create(
        req: any,
        dto: CreateGlRevenueCodeDto,
    ): Promise<GlRevenueCodeDocument> {
        return await this.glRevenueCodeModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlRevenueCodeDocument>> {
        const glRevenueCodes = await this.glRevenueCodeModelPag.paginate(
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
        return glRevenueCodes;
    }

    async findOne(glRevenueCodeId: string): Promise<GlRevenueCodeDocument> {
        const exists = await this.glRevenueCodeModel.findById(glRevenueCodeId);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        glRevenueCodeId: string,
        dto: UpdateGlRevenueCodeDto,
    ): Promise<GlRevenueCodeDocument> {
        const glRevenueCode = await this.glRevenueCodeModel.findByIdAndUpdate(
            glRevenueCodeId,
            dto,
            {
                new: true,
            },
        );

        if (!glRevenueCode) {
            throw new NotFoundException();
        }

        return glRevenueCode;
    }

    async remove(glRevenueCodeId: string): Promise<boolean> {
        const glRevenueCode = await this.glRevenueCodeModel.findByIdAndRemove(
            glRevenueCodeId,
        );

        if (!glRevenueCode) {
            throw new NotFoundException();
        }
        return true;
    }
}
