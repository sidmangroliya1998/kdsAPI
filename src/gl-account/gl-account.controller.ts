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
import { GlAccountService } from './gl-account.service';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { PaginateResult } from 'mongoose';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { GlAccountDocument } from './schemas/gl-account.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('gl-account')
@ApiTags('Gl Accounts')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class GlAccountController {
  constructor(private readonly glAccountService: GlAccountService) {}

  @Post()
  @PermissionGuard(PermissionSubject.GlAccount, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateGlAccountDto) {
    return await this.glAccountService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.GlAccount, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountDocument>> {
    return await this.glAccountService.findAll(req, paginateOptions);
  }

  @Get(':glAccountId')
  @PermissionGuard(PermissionSubject.GlAccount, Permission.Common.FETCH)
  async findOne(@Param('glAccountId') glAccountId: string) {
    return await this.glAccountService.findOne(glAccountId);
  }

  @Patch(':glAccountId')
  @PermissionGuard(PermissionSubject.GlAccount, Permission.Common.UPDATE)
  async update(
    @Req() req,
    @Param('glAccountId') glAccountId: string,
    @Body() dto: UpdateGlAccountDto,
  ) {
    return await this.glAccountService.update(req, glAccountId, dto);
  }

  @Delete(':glAccountId')
  @PermissionGuard(PermissionSubject.GlAccount, Permission.Common.DELETE)
  async remove(@Param('glAccountId') glAccountId: string) {
    return await this.glAccountService.remove(glAccountId);
  }
}
