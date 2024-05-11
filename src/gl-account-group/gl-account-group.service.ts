import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGlAccountGroupDto } from './dto/create-gl-account-group.dto';
import { UpdateGlAccountGroupDto } from './dto/update-gl-account-group.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  GlAccountGroup,
  GlAccountGroupDocument,
} from './schemas/gl-account-group.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class GlAccountGroupService {
  constructor(
    @InjectModel(GlAccountGroup.name)
    private readonly glAccountGroupModel: Model<GlAccountGroupDocument>,
    @InjectModel(GlAccountGroup.name)
    private readonly glAccountGroupModelPag: PaginateModel<GlAccountGroupDocument>,
  ) {}

  async create(
    req: any,
    dto: CreateGlAccountGroupDto,
  ): Promise<GlAccountGroupDocument> {
    return await this.glAccountGroupModel.create({
      ...dto,

      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountGroupDocument>> {
    const glAccountGroups = await this.glAccountGroupModelPag.paginate(
      { supplierId: req.user.supplierId },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return glAccountGroups;
  }

  async findOne(glAccountGroupId: string): Promise<GlAccountGroupDocument> {
    const exists = await this.glAccountGroupModel.findById(glAccountGroupId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    glAccountGroupId: string,
    dto: UpdateGlAccountGroupDto,
  ): Promise<GlAccountGroupDocument> {
    const glAccountGroup = await this.glAccountGroupModel.findByIdAndUpdate(
      glAccountGroupId,
      dto,
      {
        new: true,
      },
    );

    if (!glAccountGroup) {
      throw new NotFoundException();
    }

    return glAccountGroup;
  }

  async remove(glAccountGroupId: string): Promise<boolean> {
    const glAccountGroup = await this.glAccountGroupModel.findByIdAndRemove(
      glAccountGroupId,
    );

    if (!glAccountGroup) {
      throw new NotFoundException();
    }
    return true;
  }
}
