import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { GlTaxIndication, GlTaxIndicationDocument } from './schemas/gl-tax-indication.schema';
import { CreateGlTaxIndicationDto } from './dto/create-gl-tax-indication.dto';
import { UpdateGlTaxIndicationDto } from './dto/update-gl-tax-indication.dto';

@Injectable()
export class GlTaxIndicationService {
    constructor(
        @InjectModel(GlTaxIndication.name)
        private readonly glTaxIndicationModel: Model<GlTaxIndicationDocument>,
        @InjectModel(GlTaxIndication.name)
        private readonly glTaxIndicationModelPag: PaginateModel<GlTaxIndicationDocument>,
    ) { }

    async create(
        req: any,
        dto: CreateGlTaxIndicationDto,
    ): Promise<GlTaxIndicationDocument> {
        return await this.glTaxIndicationModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlTaxIndicationDocument>> {
        const glRevenueCodes = await this.glTaxIndicationModelPag.paginate(
            { supplierId: req.user.supplierId, deletedAt: null },
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

    async findOne(glTaxIndicationId: string): Promise<GlTaxIndicationDocument> {
        const exists = await this.glTaxIndicationModel.findById(glTaxIndicationId);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        glTaxIndicationId: string,
        dto: UpdateGlTaxIndicationDto,
    ): Promise<GlTaxIndicationDocument> {
        const glRevenueCode = await this.glTaxIndicationModel.findByIdAndUpdate(
            glTaxIndicationId,
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

    async remove(glTaxIndicationId: string): Promise<boolean> {
        const glTaxInd = await this.glTaxIndicationModel.findByIdAndUpdate(
            glTaxIndicationId,
            { deletedAt: new Date() },
            { new: true },
          );
       

        if (!glTaxInd) {
            throw new NotFoundException();
        }
        return true;
    }
}
