import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  Req,
  BadRequestException,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { OrderPermissions, PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { QueryOfferDto } from './dto/query-offer.dto';
import { OfferDocument } from './schemas/offer.schema';
import { ApiBearerAuth, ApiHeader, ApiTags ,ApiConsumes } from '@nestjs/swagger';
import { PermissionService } from 'src/permission/permission.service';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { FilesFastifyInterceptor, diskStorage } from 'fastify-file-interceptor';
import { editFileName, importFilter } from 'src/core/Helpers/file-upload-utils';
import { FileImportProcessDto } from './dto/file-import.dto';

@Controller('offer')
@ApiTags('Offers')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class OfferController {
  constructor(
    private readonly offerService: OfferService,
    private readonly permissionService: PermissionService,
  ) {}

  @Post()
  @PermissionGuard(PermissionSubject.Offer, Permission.Common.CREATE)
  async create(@Req() req, @Body() dto: CreateOfferDto) {
    return await this.offerService.create(req, dto);
  }

  @Get()
  @PermissionGuard(PermissionSubject.Offer, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryOfferDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OfferDocument>> {
    return await this.offerService.findAll(req, query, paginateOptions);
  }

  @Get(':offerId')
  @PermissionGuard(PermissionSubject.Offer, Permission.Common.FETCH)
  async findOne(@Param('offerId') offerId: string) {
    return await this.offerService.findOne(offerId);
  }

  @Get('search-by-code/:code')
  @PermissionGuard(PermissionSubject.Offer, Permission.Common.FETCH)
  async checkCode(@Req() req, @Param('code') code: string) {
    const checkPermission = await this.permissionService.userHasPermission(
      req.user,
      PermissionSubject.Order,
      Permission.Order.ApplyDiscount,
      true,
    );

    if (!checkPermission) {
      throw new BadRequestException(
        `${VALIDATION_MESSAGES.PermissionNotAllowed.key}__${OrderPermissions.ApplyDiscount}`,
      );
    }

    return await this.offerService.findByCode(req, code);
  }

  @Patch(':offerId')
  @PermissionGuard(PermissionSubject.Offer, Permission.Common.UPDATE)
  async update(@Req() req, @Param('offerId') offerId: string, @Body() dto: UpdateOfferDto) {
    const checkPermission = await this.permissionService.userHasPermission(
      req.user,
      PermissionSubject.Order,
      Permission.Order.ApplyDiscount,
      true,
    );

    if (!checkPermission) {
      throw new BadRequestException(
        `${VALIDATION_MESSAGES.PermissionNotAllowed.key}__${OrderPermissions.ApplyDiscount}`,
      );
    }

    return await this.offerService.update(offerId, dto);
  }

  @Delete(':offerId')
  @PermissionGuard(PermissionSubject.Offer, Permission.Common.DELETE)
  async remove(@Param('offerId') offerId: string) {
    return await this.offerService.remove(offerId);
  }

  @ApiConsumes('multipart/form-data')
  @Post('import-data')
  @UseInterceptors(
    FilesFastifyInterceptor('file', 1, {
      storage: diskStorage({
        destination: './upload/',
        filename: editFileName,
      }),
      fileFilter: importFilter,
    }),
  )
  async file(
    @Req() req: any,
    @UploadedFiles() file: Express.Multer.File,
    @Body() dto: FileImportProcessDto,
  ) {
    return await this.offerService.offerFileUploadProcess(req, file);
  }
}
