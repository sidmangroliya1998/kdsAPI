import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGlMaterialCodeDto } from './dto/create-gl-material-code.dto';
import { UpdateGlMaterialCodeDto } from './dto/update-gl-material-code.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  GlMaterialCode,
  GlMaterialCodeDocument,
} from './schemas/gl-material-code.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class GlMaterialCodeService {
  constructor(
    @InjectModel(GlMaterialCode.name)
    private readonly glMaterialCodeModel: Model<GlMaterialCodeDocument>,
    @InjectModel(GlMaterialCode.name)
    private readonly glMaterialCodeModelPag: PaginateModel<GlMaterialCodeDocument>,
  ) {}

  async create(
    req: any,
    dto: CreateGlMaterialCodeDto,
  ): Promise<GlMaterialCodeDocument> {
    return await this.glMaterialCodeModel.create({
      ...dto,

      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlMaterialCodeDocument>> {
    const glMaterialCodes = await this.glMaterialCodeModelPag.paginate(
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
    return glMaterialCodes;
  }

  async findOne(glMaterialCodeId: string): Promise<GlMaterialCodeDocument> {
    const exists = await this.glMaterialCodeModel.findById(glMaterialCodeId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    glMaterialCodeId: string,
    dto: UpdateGlMaterialCodeDto,
  ): Promise<GlMaterialCodeDocument> {
    const glMaterialCode = await this.glMaterialCodeModel.findByIdAndUpdate(
      glMaterialCodeId,
      dto,
      {
        new: true,
      },
    );

    if (!glMaterialCode) {
      throw new NotFoundException();
    }

    return glMaterialCode;
  }

  async remove(glMaterialCodeId: string): Promise<boolean> {
    const glMaterialCode = await this.glMaterialCodeModel.findByIdAndRemove(
      glMaterialCodeId,
    );

    if (!glMaterialCode) {
      throw new NotFoundException();
    }
    return true;
  }
}
