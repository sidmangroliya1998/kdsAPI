import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, PaginateModel, PaginateResult } from 'mongoose';
import { Role, RoleDocument } from './schemas/roles.schema';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { RoleCreateDto, RoleUpdateDto } from './role.dto';
import { STATUS_MSG } from 'src/core/Constants/status-message.constants';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { SubjectsRestrictedForSupplier } from 'src/core/Constants/permissions/permissions.enum';
import { VALIDATION_MESSAGES } from 'src/core/Constants/validation-message';
import { RoleSlug } from 'src/core/Constants/enum';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Role.name)
    private roleModelPag: PaginateModel<RoleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>, // private cacheService: CacheService,
  ) { }

  async create(req: any, roleDetails: RoleCreateDto): Promise<RoleDocument> {

    let supplierId = null;
    if (req.user.supplierId || roleDetails.supplierId) {
      delete roleDetails.slug;
      const subjects: any = roleDetails.permissions.map((p) => p.subject);
      if (
        subjects.some(
          (r) => Object.values(SubjectsRestrictedForSupplier).indexOf(r) >= 0,
        )
      ) {
        throw new BadRequestException(
          `${VALIDATION_MESSAGES.PermissionNotAllowed.key}__${Object.values(
            SubjectsRestrictedForSupplier,
          ).join(',')}`,
        );
      }

      supplierId = req.user.supplierId ?? roleDetails.supplierId;
    }
    const role = new this.roleModel({
      ...roleDetails,
      supplierId: supplierId,
      addedBy: req.user.userId,
    });
    await role.save();

    return role;
  }

  async update(
    req,
    roleId: string,
    roleDetails: RoleUpdateDto,
  ): Promise<LeanDocument<RoleDocument>> {
    if (req.user.supplierId) {
      delete roleDetails.slug;
      if (roleDetails.permissions) {
        const subjects: any = roleDetails.permissions.map((p) => p.subject);
        if (
          subjects.some(
            (r) => Object.values(SubjectsRestrictedForSupplier).indexOf(r) >= 0,
          )
        ) {
          throw new BadRequestException(
            `${VALIDATION_MESSAGES.PermissionNotAllowed.key}__${Object.values(
              SubjectsRestrictedForSupplier,
            ).join(',')}`,
          );
        }
      }
    }
    const role = await this.roleModel
      .findByIdAndUpdate(roleId, roleDetails, {
        new: true,
      })
      .lean();

    if (!role) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }
    // refresh the role in cache
    //this.cacheService.set(role.id, role);
    return role;
  }

  async all(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<RoleDocument>> {
    let query: any = {};
    if (req.user.supplierId) {
      query.$or = [
        {
          supplierId: req.user.supplierId,
        },
        {
          slug: {
            $in: [
              RoleSlug.SupplierAdmin,
              RoleSlug.Waiter,
              RoleSlug.Cashier,
              RoleSlug.Chef,
            ],
          },
        },
      ];
    }

    if (req.query.isSuperAdmin) {
      if (req.query.supplierId) {
        query = { supplierId: req.query.supplierId };
      }
      else {
        query.$or = [
          {
            supplierId: { $exists: false } // supplierId not exists
          },
          {
            supplierId: null // supplierId is null
          },
          {
            slug: {
              $in: [
                RoleSlug.SupplierAdmin,
                RoleSlug.Waiter,
                RoleSlug.Cashier,
                RoleSlug.Chef,
              ]
            }
          }
        ];

      }
    }


    const roles = await this.roleModelPag.paginate(query, {
      sort: DefaultSort,
      lean: true,
      ...paginateOptions,
      ...pagination,
      populate: [{ path: 'screenDisplays' }],
    });
    return roles;
  }

  async getRoleDetails(req: any,
    paginateOptions: PaginationDto): Promise<PaginateResult<RoleDocument>> {

    const roles = await this.roleModelPag.paginate(
      {
        supplierId: req.user.supplierId
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [{ path: 'screenDisplays' }],
      });

    return roles;
  }

  async fetch(roleId: string): Promise<LeanDocument<RoleDocument>> {
    const role = await this.roleModel
      .findOne({ _id: roleId })
      .populate([{ path: 'screenDisplays' }])
      .lean();
    if (!role) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }
    return role;
  }

  async delete(roleId: string): Promise<LeanDocument<RoleDocument>> {
    const usersHavingRole = await this.userModel.count({ role: roleId });
    if (usersHavingRole > 0)
      throw new BadRequestException(VALIDATION_MESSAGES.CanNotBeDeleted.key);
    const role = await this.roleModel.findByIdAndDelete(roleId);

    if (!role) {
      throw new NotFoundException(VALIDATION_MESSAGES.RecordNotFound.key);
    }
    return role;
  }
}
