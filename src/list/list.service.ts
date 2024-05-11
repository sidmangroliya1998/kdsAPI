import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { List, ListDocument } from './schemas/list.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose,{ Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { QueryListDto } from './dto/query-list.dto';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class ListService {
  constructor(
    @InjectModel(List.name)
    private readonly listModel: Model<ListDocument>,
    @InjectModel(List.name)
    private readonly listModelPag: PaginateModel<ListDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(req: any, dto: CreateListDto): Promise<ListDocument> {
    if (dto.reference) {
      const exists = await this.listModel.count({
        supplierId: req.user.supplierId,
        type: dto.type,
        reference: dto.reference,
      });
      if (exists > 0) {
        throw new BadRequestException(
          `Record exists with same reference - ${dto.reference}`,
        );
      }
    }
    return await this.listModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    query: QueryListDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<ListDocument>> {
    let queryToApply: any = query;
    if (query.filter) {     
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    
    let getAllRest: any = [];
    if (req.user && req.user.userId && req.user.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (req.query.restaurantId) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(req.query.restaurantId)] } }
        ];
      } else {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(req.query.restaurantId)] } }
        ];
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } }
        ];
      }
    }
    const lists = await this.listModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
        deletedAt: null,
      },
      {
        sort: paginateOptions.sortBy
          ? {
              [paginateOptions.sortBy]: paginateOptions.sortDirection
                ? paginateOptions.sortDirection
                : -1,
            }
          : DefaultSort,
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
    return lists;
  }

  async findOne(listId: string): Promise<ListDocument> {
    const exists = await this.listModel.findById(listId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    req: any,
    listId: string,
    dto: UpdateListDto,
  ): Promise<ListDocument> {
    if (dto.reference) {
      const exists = await this.listModel.count({
        supplierId: req.user.supplierId,
        type: dto.type,
        reference: dto.reference,
        _id: { $ne: listId },
      });
      if (exists > 0) {
        throw new BadRequestException(
          `Record exists with same reference - ${dto.reference}`,
        );
      }
    }
    const list = await this.listModel.findByIdAndUpdate(listId, dto, {
      new: true,
    });

    if (!list) {
      throw new NotFoundException();
    }

    return list;
  }

  async remove(listId: string): Promise<boolean> {
    const list = await this.listModel.findByIdAndUpdate(
      listId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!list) {
      throw new NotFoundException();
    }
    return true;
  }
}
