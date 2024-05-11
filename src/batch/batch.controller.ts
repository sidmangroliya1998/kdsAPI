import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { BatchService } from './batch.service';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginateResult } from 'mongoose';
import { QueryBatchDto } from './dto/query-batch.dto';
import { PaginationDto } from 'src/core/Constants/pagination';
import { BatchDocument } from './schemas/batch.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('batch')
@ApiTags('Batch')
@ApiBearerAuth('access-token')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}
  @Get()
  @PermissionGuard(PermissionSubject.InvoiceReceipt, Permission.Common.LIST)
  async findAll(
    @Req() req,
    @Query() query: QueryBatchDto,
    @Query() paginateOptions: PaginationDto,
  ): Promise<PaginateResult<BatchDocument>> {
    return await this.batchService.findAll(req, query, paginateOptions);
  }

  @Get(':batchId')
  @PermissionGuard(PermissionSubject.InvoiceReceipt, Permission.Common.FETCH)
  async findOne(@Param('batchId') batchId: string) {
    return await this.batchService.findOne(batchId);
  }
}
