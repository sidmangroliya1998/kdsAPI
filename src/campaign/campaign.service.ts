import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    @InjectModel(Campaign.name)
    private readonly campaignModelPag: PaginateModel<CampaignDocument>,
  ) {}

  async create(req: any, dto: CreateCampaignDto): Promise<CampaignDocument> {
    return await this.campaignModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CampaignDocument>> {
    const campaigns = await this.campaignModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        deletedAt: null,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return campaigns;
  }

  async findOne(campaignId: string): Promise<CampaignDocument> {
    const exists = await this.campaignModel.findById(campaignId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findByIdAndUpdate(
      campaignId,
      dto,
      {
        new: true,
      },
    );

    if (!campaign) {
      throw new NotFoundException();
    }

    return campaign;
  }

  async remove(campaignId: string): Promise<boolean> {
    const campaign = await this.campaignModel.findByIdAndUpdate(
      campaignId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!campaign) {
      throw new NotFoundException();
    }
    return true;
  }
}
