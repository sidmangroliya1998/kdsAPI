import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { InjectModel } from '@nestjs/mongoose';
import { GlAccount, GlAccountDocument } from './schemas/gl-account.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { GlAccountBalance, GlAccountBalanceDocument } from './schemas/gl-account-balance.schema';

@Injectable()
export class GlAccountService {
  constructor(
    @InjectModel(GlAccount.name)
    private readonly glAccountModel: Model<GlAccountDocument>,
    @InjectModel(GlAccount.name)
    private readonly glAccountModelPag: PaginateModel<GlAccountDocument>,
    @InjectModel(GlAccountBalance.name)
    private readonly glAccBalanceModel: Model<GlAccountBalanceDocument>,

  ) { }

  async create(req: any, dto: CreateGlAccountDto): Promise<GlAccountDocument> {
    const exists = await this.glAccountModel.count({
      supplierId: req.user.supplierId,
      glNumber: dto.glNumber,
    });
    if (exists > 0) {
      throw new BadRequestException(`${dto.glNumber} already exists`);
    }
    const accData = await this.glAccountModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });

    await this.glAccBalanceModel.create({
      supplierId: req.user.supplierId,
      glAccountId: accData?._id,
      totalCredit: 0,
      totalDebit: 0,
      totalBalance: 0
    });

    return accData;
  }

  async findAll(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<GlAccountDocument>> {
    const glAccounts = await this.glAccountModelPag.paginate(
      { supplierId: req.user.supplierId },
      {
        sort: { glNumber: 1 },
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return glAccounts;
  }

  async findOne(glAccountId: string): Promise<GlAccountDocument> {
    const exists = await this.glAccountModel.findById(glAccountId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    req,
    glAccountId: string,
    dto: UpdateGlAccountDto,
  ): Promise<GlAccountDocument> {
    const exists = await this.glAccountModel.count({
      supplierId: req.user.supplierId,
      glNumber: dto.glNumber,
      _id: { $ne: glAccountId },
    });
    if (exists > 0) {
      throw new BadRequestException(`${dto.glNumber} already exists`);
    }
    const glAccount = await this.glAccountModel.findByIdAndUpdate(
      glAccountId,
      dto,
      {
        new: true,
      },
    );

    if (!glAccount) {
      throw new NotFoundException();
    }

    return glAccount;
  }

  async remove(glAccountId: string): Promise<boolean> {
    const glAccount = await this.glAccountModel.findByIdAndRemove(glAccountId);

    if (!glAccount) {
      throw new NotFoundException();
    }
    return true;
  }
}
