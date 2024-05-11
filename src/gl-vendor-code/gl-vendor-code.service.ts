import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGlVendorCodeDto } from './dto/create-gl-vendor-code.dto';
import { UpdateGlVendorCodeDto } from './dto/update-gl-vendor-code.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  GlVendorCode,
  GlVendorCodeDocument,
} from './schemas/gl-vendor-code.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class GlVendorCodeService {
  constructor(
    @InjectModel(GlVendorCode.name)
    private readonly glVendorCodeModel: Model<GlVendorCodeDocument>,
    @InjectModel(GlVendorCode.name)
    private readonly glVendorCodeModelPag: PaginateModel<GlVendorCodeDocument>,
  ) {}

  async create(
    req: any,
    dto: CreateGlVendorCodeDto,
  ): Promise<GlVendorCodeDocument> {
    return await this.glVendorCodeModel.create({
      ...dto,

      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlVendorCodeDocument>> {
    const glVendorCodes = await this.glVendorCodeModelPag.paginate(
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
    return glVendorCodes;
  }

  async findOne(glVendorCodeId: string): Promise<GlVendorCodeDocument> {
    const exists = await this.glVendorCodeModel.findById(glVendorCodeId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    glVendorCodeId: string,
    dto: UpdateGlVendorCodeDto,
  ): Promise<GlVendorCodeDocument> {
    const glVendorCode = await this.glVendorCodeModel.findByIdAndUpdate(
      glVendorCodeId,
      dto,
      {
        new: true,
      },
    );

    if (!glVendorCode) {
      throw new NotFoundException();
    }

    return glVendorCode;
  }

  async remove(glVendorCodeId: string): Promise<boolean> {
    const glVendorCode = await this.glVendorCodeModel.findByIdAndRemove(
      glVendorCodeId,
    );

    if (!glVendorCode) {
      throw new NotFoundException();
    }
    return true;
  }
}
