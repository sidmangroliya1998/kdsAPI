import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  PaginateModel,
  PaginateResult,
  PopulateOption,
  PopulateOptions,
} from 'mongoose';

import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { Cashier, CashierDocument } from './schemas/cashier.schema';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateCashierDto } from './dto/update-cashier.dto';
import { CashierHelperService } from './cashier-helper.service';
import { PaymentMethod } from 'src/payment/enum/en.enum';
import { CashierLogService } from './cashier-log.service';
import { CashierLogDocument } from './schemas/cashier-log.schema';
import { PaymentStatus } from 'src/core/Constants/enum';
import { QueryCashierDto } from './dto/cashier-log.dto';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { CashierDashboardDto } from './dto/cashier-dashboard.dto';

@Injectable()
export class CashierService {
  constructor(
    @InjectModel(Cashier.name)
    private readonly cashierModel: Model<CashierDocument>,
    @InjectModel(Cashier.name)
    private readonly cashierModelPag: PaginateModel<CashierDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly cashierHelperService: CashierHelperService,
    @Inject(forwardRef(() => CashierLogService))
    private readonly cashierLogService: CashierLogService,
  ) { }

  async create(req: any, dto: CreateCashierDto): Promise<CashierDocument> {
    const cashier = await this.cashierModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
    this.cashierHelperService.postCashierCreate(req, cashier);
    return cashier;
  }

  async findAll(
    req: any,
    query: QueryCashierDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<CashierDocument>> {
    let userQuery: any = {};
    // const user = await this.userModel.findById(req.user.userId);
    // if (user && user.cashier) {
    //   userQuery = { _id: user.cashier };
    // }
    if (query.activeCashiers == true) {
      // userQuery.currentLog = { $ne: null };
    } else if (query.nonActiveCashiers == true) {
      userQuery.currentLog = null;
    }

    const cashiers = await this.cashierModelPag.paginate(
      {
        supplierId: req.user.supplierId,
        ...query,
        ...userQuery,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'currentLog',
            populate: [
              {
                path: 'transactions',
                populate: query.includeOrders
                  ? [
                    {
                      path: 'orderId',
                    },
                  ]
                  : [],
              },
            ],
          },
        ],
      },
    );
    return cashiers;
  }

  async findOne(cashierId: string): Promise<CashierDocument> {
    const exists = await this.cashierModel.findById(cashierId).populate([
      {
        path: 'currentLog',
        populate: [
          {
            path: 'transactions',
          },
        ],
      },
    ]);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async update(
    cashierId: string,
    dto: UpdateCashierDto | any,
  ): Promise<CashierDocument> {
    const cashier = await this.cashierModel.findByIdAndUpdate(cashierId, dto, {
      new: true,
    });

    if (!cashier) {
      throw new NotFoundException();
    }
    this.cashierHelperService.postCashierUpdate(cashier, dto);

    return cashier;
  }

  async remove(cashierId: string): Promise<boolean> {
    const cashier = await this.cashierModel.findByIdAndRemove(cashierId);

    if (!cashier) {
      throw new NotFoundException();
    }
    return true;
  }

  async findDashboard(cashierId: string): Promise<any> {
    const cashierData = await this.cashierLogService.current(cashierId);

    return cashierData?.dashboard ?? {};
  }

  async findDashboards(req, query: CashierDashboardDto) {
    const resQuery: any = {};
    if (query.restaurantId) {
      resQuery.restaurantId = { $in: query.restaurantId };
    }
    // if (query.cashierId) {
    //   resQuery._id = { $in: query.cashierId };
    // }
    const cashiers = await this.cashierModel.find({
      supplierId: req.user.supplierId,
      active: true,
      currentLog: { $ne: null },
      ...resQuery,
    });

    const dashboard = {
      openingBalance: 0,
      totalRefunds: 0,
      totalSales: 0,
      salesPaidWithCash: 0,
      salesPaidWithCard: 0,
      expectedCashAtClose: 0,
      deferredAmount: 0,
      totalRemianingAmountToCollect: 0,
      expenseAmount: 0,
      tip: 0,
      salesPaidWithHungerStation: 0,
      salesPaidWithJahezSales: 0,
      salesPaidWithToyoSales: 0,
      salesPaidWithOtherSales: 0
    };

    for (const i in cashiers) {
      const response = await this.cashierLogService.current(
        cashiers[i]._id.toString(),
      );

      if (response?.dashboard) {
        dashboard.openingBalance += response.dashboard.openingBalance;
        dashboard.totalRefunds += response.dashboard.totalRefunds;
        dashboard.totalSales += response.dashboard.totalSales;
        dashboard.salesPaidWithCash += response.dashboard.salesPaidWithCash;
        dashboard.salesPaidWithCard += response.dashboard.salesPaidWithCard;
        dashboard.expectedCashAtClose += response.dashboard.expectedCashAtClose;
        dashboard.deferredAmount += response.dashboard.deferredAmount;
        dashboard.totalRemianingAmountToCollect +=
          response.dashboard.totalRemianingAmountToCollect;
        dashboard.expenseAmount += response.dashboard.expenseAmount;
        dashboard.tip += response.dashboard.tip;
        dashboard.salesPaidWithHungerStation += response.dashboard.salesPaidWithHungerStation;
        dashboard.salesPaidWithJahezSales += response.dashboard.salesPaidWithJahezSales;
        dashboard.salesPaidWithToyoSales += response.dashboard.salesPaidWithToyoSales;
        dashboard.salesPaidWithOtherSales += response.dashboard.salesPaidWithOtherSales;
      }
    }
    return dashboard;
  }
  async getDashboardWithDetail(req, query: CashierDashboardDto,
    paginateOptions: PaginationDto
  ) {
    // const resQuery: any = {};
    // if (query.restaurantId) {
    //   resQuery.restaurantId = { $in: query.restaurantId };
    // }
    let cashierIds: any = []

    if (query.restaurantId) {
      cashierIds = await this.cashierModel.find({
        supplierId: req.user.supplierId,
        restaurantId: { $in: query.restaurantId },
        active: true
      });
    }

    console.log("cashierIds", cashierIds);
    // if (query.cashierId) {
    //   resQuery._id = { $in: query.cashierId };
    // }

    const response = [];
    const docs = [];

    const allLogs = await this.cashierLogService.logsWithTransaction(req, cashierIds[0]['_id'], paginateOptions);

    for (let i = 0; i < allLogs?.docs.length; i++) {
      const el: any = allLogs?.docs[i];

      let dashboard: any = undefined;
      if (el?.closedAt == null || !el?.closedAt || !el?.closeCashierDashboard) {
        const cashierLogModel = {
          cashierId: cashierIds[0]['_id'],
          startedAt: el?.startedAt,
          closedAt: el?.closedAt,
          supplierId: req.user.supplierId,
          transactions: el?.transactions,
          expenses: el?.expenses,
          openingBalance: el?.openingBalance
        }
        dashboard = await this.cashierHelperService.prepareDashboardData(cashierLogModel);
      }

      docs.push(
        {
          cashierLogId: el?._id,
          cashierLogTime: el?.startedAt,
          cashierClosingTime: el?.closedAt,
          expenses: el?.expenses,
          userId: el?.userId,
          cashierId: el?.cashierId,
          dashboard: dashboard ? dashboard : el?.closeCashierDashboard
        }
      )
    }
    response.push({
      docs: docs,
      totalDocs: allLogs?.totalDocs,
      limit: allLogs?.limit,
      page: allLogs?.page,
      totalPages: allLogs?.totalPages,
      pagingCounter: allLogs?.pagingCounter,
      hasPrevPage: allLogs?.hasPrevPage,
      hasNextPage: allLogs?.hasNextPage,
      prevPage: allLogs?.prevPage,
      nextPage: allLogs?.nextPage
    })

    return response;

  }


}
