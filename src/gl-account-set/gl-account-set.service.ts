import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGlAccountSetDto } from './dto/create-gl-account-set.dto';
import { UpdateGlAccountSetDto } from './dto/update-gl-account-set.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  GlAccountSet,
  GlAccountSetDocument,
} from './schemas/gl-account-set.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class GlAccountSetService {
  constructor(
    @InjectModel(GlAccountSet.name)
    private readonly glAccountSetModel: Model<GlAccountSetDocument>,
    @InjectModel(GlAccountSet.name)
    private readonly glAccountSetModelPag: PaginateModel<GlAccountSetDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateGlAccountSetDto,
  ): Promise<GlAccountSetDocument> {
    return await this.glAccountSetModel.create({
      ...dto,

      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountSetDocument>> {
    const glAccountSets = await this.glAccountSetModelPag.paginate(
      { supplierId: req.user.supplierId },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return glAccountSets;
  }

  async findOne(glAccountSetId: string): Promise<GlAccountSetDocument> {
    const exists = await this.glAccountSetModel.findById(glAccountSetId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    glAccountSetId: string,
    dto: UpdateGlAccountSetDto,
  ): Promise<GlAccountSetDocument> {
    const glAccountSet = await this.glAccountSetModel.findByIdAndUpdate(
      glAccountSetId,
      dto,
      {
        new: true,
      },
    );

    if (!glAccountSet) {
      throw new NotFoundException();
    }

    return glAccountSet;
  }

  async remove(glAccountSetId: string): Promise<boolean> {
    const glAccountSet = await this.glAccountSetModel.findByIdAndRemove(
      glAccountSetId,
    );

    if (!glAccountSet) {
      throw new NotFoundException();
    }
    return true;
  }

  async updateManyGLAcc(req, glAccountIds: string[]): Promise<boolean> {
    await this.glAccountSetModel.updateMany(
      { supplierId: req.user.supplierId },
      { $pullAll: { glAccountIds: glAccountIds } }
    )
    return true;
  }
}
