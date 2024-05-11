import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { CreateDebtEmpDto } from '../dto/create-emp-debt.dto';
import { DebtPaymentStatus, PaymentStatus } from 'src/core/Constants/enum';
import { DebtDocType, TransStatus } from 'src/core/Constants/enum';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import mongoose, { AggregatePaginateResult, AggregatePaginateModel } from 'mongoose';
import { EmpDebt, EmpDebtDocument } from '../schemas/emp-debt.schema';
import { EmpDebtFindAllDto, EmpDebtSummaryDto } from '../dto/query-emp-debt-summary.dto';
import { TIMEZONE } from 'src/core/Constants/system.constant';
import { UpdateEmpDebtDto } from '../dto/update-emp-debt.dto';

@Injectable()
export class EmpDebtService {
    constructor(
        @InjectModel(EmpDebt.name)
        private readonly empDebtModel: Model<EmpDebtDocument>,
        @InjectModel(EmpDebt.name)
        private readonly empDebtModelPag: PaginateModel<EmpDebtDocument>,
        @InjectModel(EmpDebt.name)
        private readonly empDebtModelAggPag: AggregatePaginateModel<EmpDebtDocument>,
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
    ) { }

    async create(
        req: any,
        dto: CreateDebtEmpDto,
    ): Promise<EmpDebtDocument> {
        let counter = 1;
        let _lastDocNo = await this.empDebtModel.findOne(
            {
                supplierId: req.user.supplierId,
                $expr: {
                    $eq: [{ $year: '$createdAt' }, new Date().getFullYear()],
                },
            },
            {},
            {
                sort: {
                    _id: -1,
                },
            },
        )
        if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('ED-', '');
            const arr = _lastDocNo.docNumber.split('-');

            if (arr.length > 0) {
                counter = parseInt(arr[0], 10) + 1;
            }
        }
        const _docNumber = 'ED-' + String(counter).padStart(5, '0');

        if (dto.isDebtReversal && dto.referenceEmpDebtId) {
            const referenceEmpDebt = await this.empDebtModel.findById(dto.referenceEmpDebtId);
            if (!referenceEmpDebt) throw new NotFoundException(`Emp Debt with id ${dto.referenceEmpDebtId} not found`);

            let remainCost = referenceEmpDebt.remainCost - dto.totalAmount;
            let paymentStatus = remainCost > 0 ? DebtPaymentStatus.PartiallyPaid : DebtPaymentStatus.Paid;
            let paidAmount = referenceEmpDebt.paidAmount + dto.totalAmount;

            await referenceEmpDebt.update({ remainCost: remainCost, paidAmount: paidAmount, paymentStatus: paymentStatus });

            return await this.empDebtModel.create({
                ...dto,
                docNumber: _docNumber,
                supplierId: req.user.supplierId,
                addedBy: req.user.userId,
                docType: DebtDocType.DebtPaid,
                remainCost: 0,
                paidAmount: dto.totalAmount,
                paymentStatus: DebtPaymentStatus.Paid,
                referenceNumber: referenceEmpDebt.referenceNumber
            });
        } else {
            return await this.empDebtModel.create({
                ...dto,
                docNumber: _docNumber,
                supplierId: req.user.supplierId,
                addedBy: req.user.userId,
                docType: DebtDocType.Standard,
                remainCost: dto.totalAmount,
                paidAmount: 0
            });
        }
    }

    async update(
        empDebtId: string,
        dto: UpdateEmpDebtDto,
    ): Promise<EmpDebtDocument> {
        const empDebt = await this.empDebtModel.findByIdAndUpdate(empDebtId, dto, { new: true, },);
        if (!empDebt) {
            throw new NotFoundException();
        }
        return empDebt;
    }

    async approve(
        empDebtId: string,
    ): Promise<EmpDebtDocument> {
        const empDebt = await this.empDebtModel.findByIdAndUpdate(empDebtId, { transType: TransStatus.Approved }, { new: true },);

        if (!empDebt) {
            throw new NotFoundException();
        }

        return empDebt;
    }

    async findAll(
        req: any,
        query: EmpDebtFindAllDto,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpDebtDocument>> {

        let queryToApply: any = {};

        let getAllRest: any = [];
        if (req.user.userId && req.user.userId != '') {
            getAllRest = await this.userModel.findById(req.user.userId);
        }

        if (req.query.restaurantIds) {
            if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
                queryToApply.$or = [
                    { restaurantId: { $in: getAllRest?.restaurantId } },
                    { restaurantId: { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) } }
                ];
            } else {
                queryToApply.restaurantId = { $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)) };
            }
        } else {
            if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
                queryToApply.$or = [
                    { restaurantId: { $in: getAllRest?.restaurantId } },
                ];
            }
        }

        if (query.startDate && query.endDate) {
            query.startDate.setUTCHours(0);
            query.startDate.setUTCMinutes(0);
            // query.startDate = new Date(
            //     query.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
            // );
            query.endDate.setUTCHours(23);
            query.endDate.setUTCMinutes(59);
            // query.endDate = new Date(
            //     query.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
            // );

            queryToApply.date = {
                $gte: query.startDate,
                $lte: query.endDate,
            };
        }

        if (req.query.employeeIds) {
            queryToApply.empId = {
                $in: req.query.employeeIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
            };
        }

        if (req.query && req.query.referenceNumber && req.query.referenceNumber != '') {
            const refQuery = {
                $expr: {
                    $regexMatch: {
                        input: { $toString: "$referenceNumber" },
                        regex: req.query.referenceNumber,
                        options: "i",
                    }
                }
            };
            queryToApply = { ...queryToApply, ...refQuery };
        }
        if (req.query && req.query.docNumber && req.query.docNumber !== '') {
            const docNumberQuery = {
                $expr: {
                    $regexMatch: {
                        input: { $toString: "$docNumber" },
                        regex: req.query.docNumber,
                        options: "i",
                    }
                }
            };
            queryToApply = { ...queryToApply, ...docNumberQuery };
        }

        if (query.minAmount > 0 || query.maxAmount > 0) {
            const amountRangeQuery: any = {};

            if (query.minAmount > 0) {
                amountRangeQuery.$gte = Number(query.minAmount);
            }
            if (query.maxAmount > 0) {
                amountRangeQuery.$lte = Number(query.maxAmount);
            }
            queryToApply.totalAmount = amountRangeQuery;
        }

        if (req.query.createdByIds) {
            queryToApply.addedBy = {
                $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
            };
        }



        if (req.query.debtType) {
            queryToApply.debtType = {
                $in: req.query.debtType.split(','),
            };
        }
        if (req.query.displayReversal && req.query.displayReversal != 'all') {
            queryToApply.isDebtReversal = req.query.displayReversal == 'R';
        }


        if (req.query.paymentStatus) {
            queryToApply.paymentStatus = {
                $in: req.query.paymentStatus.split(','),
            };
        }

        const empDebts = await this.empDebtModelPag.paginate(
            {
                supplierId: req.user.supplierId,
                ...queryToApply,
            },
            {
                sort: DefaultSort,
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
                    {
                        path: 'restaurantId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            email: 1,
                            _id: 1,
                        },
                    },
                    {
                        path: 'empId',
                        select: {
                            name: 1,
                            _id: 1,
                        },
                    },
                    {
                        path: 'referenceEmpDebtId',
                        select: {
                            docNumber: 1,
                            _id: 1,
                        },
                    },
                ]
            },
        );
        return empDebts;
    }

    async summary(
        req: any,
        query: EmpDebtSummaryDto,
        paginateOptions: PaginationDto,
    ): Promise<[AggregatePaginateResult<EmpDebtDocument>]> {


        let match: any = { ...query }

        // if (query.empId) {
        //     match.empId = new mongoose.Types.ObjectId(query.empId);
        // }

        if (req.query.employeeIds) {
            match.empId = {
                $in: req.query.employeeIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
            };
        }
        if (query.startDate && query.endDate) {
            query.startDate.setUTCHours(0);
            query.startDate.setUTCMinutes(0);
            // query.startDate = new Date(
            //     query.startDate.toLocaleString('en', { timeZone: TIMEZONE }),
            // );
            query.endDate.setUTCHours(23);
            query.endDate.setUTCMinutes(59);
            // query.endDate = new Date(
            //     query.endDate.toLocaleString('en', { timeZone: TIMEZONE }),
            // );

            match.date = {
                $gte: query.startDate,
                $lte: query.endDate,
            };
            delete match.startDate
            delete match.endDate
        }

        if (query.restaurantId) {
            match.restaurantId = new mongoose.Types.ObjectId(query.restaurantId);
        }

        const empDebts = await this.empDebtModelAggPag.aggregatePaginate(
            this.empDebtModel.aggregate([
                {
                    $match: {
                        supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                        docType: DebtDocType.Standard,
                        ...match,
                    },
                },
                {
                    $lookup: {
                        from: 'emps',
                        localField: 'empId',
                        foreignField: '_id',
                        as: 'empId',
                    },
                },
                {
                    $unwind: { path: '$empId', preserveNullAndEmptyArrays: true },
                },
                {
                    $group: {
                        _id: {
                            debtType: '$debtType',
                            empId: '$empId._id'
                        },
                        totalAmount: { $sum: '$totalAmount' },
                        totalPaid: { $sum: '$paidAmount' },
                        totalRemainCost: { $sum: '$remainCost' },
                        employeeDetails: { $first: '$empId' }, // Collect employee details
                    }
                }
                // {
                //   $project: {
                //     _id: 1,
                //     name: 1, // Include the 'name' field from userModel
                //     status: 1 // Include the 'status' field from the $lookup
                //   }
                // }
            ]),
            {
                sort: DefaultSort,
                lean: true,
                ...paginateOptions,
                ...pagination,
            },
        );


        console.log(empDebts, "empDebts")

        return [empDebts];
    }

    async findOne(empDebtId: string): Promise<EmpDebtDocument> {
        const exists = await this.empDebtModel.findById(empDebtId).populate("empId restaurantId addedBy referenceEmpDebtId");

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }




}
