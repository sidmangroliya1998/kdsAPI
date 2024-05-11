import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { CampaignDocument } from './schemas/campaign.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('campaign')
@ApiTags('Campaigns')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @PermissionGuard(PermissionSubject.Campaign, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateCampaignDto) {
    return await this.campaignService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Campaign, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CampaignDocument>> {
    return await this.campaignService.findAll(req, paginateOptions);
  }

  @Get(':campaignId')
  @PermissionGuard(PermissionSubject.Campaign, Permission.Common.FETCH)
  async findOne(@Param('campaignId') campaignId: string) {
    return await this.campaignService.findOne(campaignId);
  }

  @Patch(':campaignId')
  @PermissionGuard(PermissionSubject.Campaign, Permission.Common.UPDATE)
  async update(
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return await this.campaignService.update(campaignId, dto);
  }

  @Delete(':campaignId')
  @PermissionGuard(PermissionSubject.Campaign, Permission.Common.DELETE)
  async remove(@Param('campaignId') campaignId: string) {
    return await this.campaignService.remove(campaignId);
  }
}
