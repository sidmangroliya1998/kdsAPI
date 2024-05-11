import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  ImpersonateSupplierDto,
  QueryUserDto,
  UserUpdateDto,
} from './dto/users.dto';

import { User, UserDocument } from './schemas/users.schema';
import { STATUS_MSG } from 'src/core/Constants/status-message.constants';
import { generateRandomPassword } from 'src/core/Helpers/universal.helper';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { Role, RoleDocument } from 'src/role/schemas/roles.schema';
import { RoleSlug } from 'src/core/Constants/enum';
import { JwtService } from '@nestjs/jwt';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { MailService } from 'src/notification/mail/mail.service';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private userModelPag: PaginateModel<UserDocument>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly cacheService: CacheService,
  ) { }

  async create(req: any, userRequest: any): Promise<UserDocument> {
    const userExists = await this.findByEmail(userRequest.email);
    if (userExists) {
      throw new BadRequestException(VALIDATION_MESSAGES.SameEmailExist.key);
    }
    if (userRequest.role) {
      const role = await this.roleModel.findById(userRequest.role);
      if (!role)
        throw new NotFoundException(VALIDATION_MESSAGES.RoleNotFound.key);

      console.log(role);
      if (
        req?.user?.supplierId &&
        req?.user?.supplierId.toString() != role?.supplierId?.toString() &&
        ![
          RoleSlug.SupplierAdmin,
          RoleSlug.Waiter,
          RoleSlug.Cashier,
          RoleSlug.Chef,
        ].includes(role.slug)
      ) {
        throw new NotFoundException(VALIDATION_MESSAGES.RoleNotFound.key);
      }
    }
    let userDetails: any = userRequest;
    if (req) {
      userDetails = {
        ...userDetails,
        supplierId: req.user.supplierId ?? userRequest?.supplierId,
        addedBy: req.user ? req.user.userId : null,
      };
    }
    if (!userDetails.password) {
      userDetails.password = generateRandomPassword();
    }

    const user = await new this.userModel(userDetails);
    this.postUserCreate(user);
    return await user.save();
  }

  async postUserCreate(user: UserDocument) {
    await this.userModel.updateMany(
      {
        supplierId: user.supplierId,
        _id: { $ne: user._id },
      },
      {
        $set: {
          isDefaultWaiter: false,
        },
      },
    );
  }

  async update(
    userId: string,
    userDetailes: UserUpdateDto,
  ): Promise<LeanDocument<User>> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, userDetailes, {
        new: true,
        projection: { password: 0 },
      })
      .lean();
    if (!user) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }
    return user;
  }

  async changePassword(req: any, dto: ChangeUserPasswordDto): Promise<boolean> {
    const user = await this.userModel.findOne({
      supplierId: req.user.supplierId ?? req.query.supplierId,
      _id: dto.userId,
    });
    if (!user)
      throw new BadRequestException(VALIDATION_MESSAGES.InvalidUserId.key);

    user.password = dto.password;
    await user.save();
    if (user.email) {
      const html = `The system admin has set following password for you account.
    <b>${dto.password}</b>`;

      this.mailService.send({
        to: user.email,
        subject: 'Password Update',
        body: html,
      });
    }
    if (user) {
      return true;
    }
    return false;
  }

  async all(
    req: any,
    query: QueryUserDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<UserDocument>> {

    let supplierId = null;
    if (req.user.supplierId) {
      supplierId = req.user.supplierId;
    }
    else if (req.query.supplierId) {
      supplierId = req.query.supplierId;
    }


    const users = await this.userModelPag.paginate(
      {
        supplierId: supplierId,
        ...query,
      },
      {
        projection: { password: 0 },
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'role',
          },
        ],
      },
    );

    return users;
  }

  async fetch(userId: string): Promise<LeanDocument<User>> {
    let user = await this.cacheService.get(userId);
    if (!user) {
      user = await this.userModel
        .findOne({
          _id: userId,
        })
        .lean();
      if (user) {
        await this.cacheService.set(userId, user);
      }
    }

    if (!user) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }

    return user;
  }

  async delete(userId: string): Promise<LeanDocument<User>> {
    const user = await this.userModel.findByIdAndDelete(userId).lean();
    if (!user) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }
    return user;
  }

  async findByEmail(email: string): Promise<LeanDocument<UserDocument>> {
    const user = await this.userModel.findOne(
      { email: { $regex: new RegExp('^' + email + '$', 'i') } }
    ).lean();    

    return user;
  }

  async findByPhoneNumber(
    phoneNumber: string,
  ): Promise<LeanDocument<UserDocument>> {
    const user = await this.userModel.findOne({ phoneNumber }).lean();

    return user;
  }

  async findAdmin(): Promise<LeanDocument<User[]>> {
    return this.userModel.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $match: { 'role.slug': 'Admin' },
      },
    ]);
  }

  async impersonateSupplier(
    req,
    supplierDetails: ImpersonateSupplierDto,
  ): Promise<any> {
    const adminRole = await this.roleModel.findOne({
      slug: RoleSlug.SupplierAdmin,
    });
    const user = await this.userModel.findOne({
      supplierId: supplierDetails.supplierId,
      role: adminRole._id,
      isBlocked: false,
    });

    if (!user) {
      throw new BadRequestException();
    }
    const payload = {
      userId: user._id,

      roleId: user.role,
      email: user.email,

      supplierId: supplierDetails.supplierId,
    };

    return await this.jwtService.sign(payload);
  }
}
