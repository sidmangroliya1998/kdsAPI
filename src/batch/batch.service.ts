import { Injectable, NotFoundException } from '@nestjs/common';
import { Batch, BatchDocument } from './schemas/batch.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { DefaultSort, PaginationDto } from 'src/core/Constants/pagination';
import { pagination } from '../core/Constants/pagination';
import { QueryBatchDto } from './dto/query-batch.dto';
import { MongooseQueryParser } from 'mongoose-query-parser';

@Injectable()
export class BatchService {
  constructor(
    @InjectModel(Batch.name)
    private readonly batchModel: Model<BatchDocument>,
    @InjectModel(Batch.name)
    private readonly batchModelPag: PaginateModel<BatchDocument>,
  ) {}

  async findOne(batchId: string): Promise<BatchDocument> {
    const exists = await this.batchModel.findById(batchId);
    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async findAll(
    req: any,
    query: QueryBatchDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<BatchDocument>> {
    let queryToApply: any = query;
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    const batches = await this.batchModelPag.paginate(
      { supplierId: req.user.supplierId, ...queryToApply },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return batches;
  }
}
