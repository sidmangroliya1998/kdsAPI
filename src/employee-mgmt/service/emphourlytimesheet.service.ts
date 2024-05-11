import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { CreateEmpHourlyTimeSheetDto } from '../dto/create-emp-hourly-timesheet.dto';
import { EmpTimeSheet, EmpTimeSheetDocument } from '../schemas/emp-hourly-timesheet.schema';
import { UpdateEmpHourlyTimeSheetDto } from '../dto/update-emp-hourly-timesheet.dto';
import { Emp, EmpDocument } from '../schemas/emp.schema';
import { EmployeePayPlan } from '../enum/en';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { QueryPayRollDto } from '../dto/query-payroll-dto';
import { EmpMonthlySalary, EmpMonthlySalaryDocument } from '../schemas/emp-monthly-payroll.schema';
import * as moment from 'moment';

@Injectable()
export class EmpTimeSheetService {
    constructor(
        @InjectModel(EmpTimeSheet.name)
        private readonly emphourlyModel: Model<EmpTimeSheetDocument>,
        @InjectModel(EmpTimeSheet.name)
        private readonly emphourlyPag: PaginateModel<EmpTimeSheetDocument>,

        @InjectModel(Emp.name)
        private readonly empModel: Model<EmpDocument>,

        @InjectModel(EmpMonthlySalary.name)
        private readonly empMonthlyModel: Model<EmpMonthlySalaryDocument>,
        @InjectModel(EmpMonthlySalary.name)
        private readonly empMonthlyModelPeg: PaginateModel<EmpMonthlySalaryDocument>,

        private readonly glVoucherHelperService: GlVoucherHelperService,
    ) { }

    async create(
        req: any,
        dto: CreateEmpHourlyTimeSheetDto,
    ): Promise<any> {

        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.emphourlyModel.findOne(
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('PY-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'PY-' + postFix + String(counter).padStart(5, '0');

        const updatedDto = { ...dto };
        let totalAmount = 0;
        // Iterate through timeSheetDetails and update hourCost and hourTotal
        const updateHourlyData = async (ele) => {
            const empData = await this.empModel.findById(ele?.empId);
            if (empData.payPlan === EmployeePayPlan.Hourly) {
                ele?.timeSheetDetailsItemData.forEach((item) => {
                    totalAmount += item.hourAmount * empData.hourlyRate;
                    item.hourCost = empData.hourlyRate;
                    item.hourTotal = item.hourAmount * empData.hourlyRate;
                });
            }
        };
        await Promise.all((updatedDto?.timeSheetDetails || []).map(updateHourlyData));

        const empHourlyDoc = await this.emphourlyModel.create({
            ...updatedDto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
            docNumber: _docNumber
        });

        empHourlyDoc.totalAmount = totalAmount;
        empHourlyDoc.save();

        // await this.glVoucherHelperService.handleEmployeeHourlyRate(empHourlyDoc, totalAmount);
        return empHourlyDoc
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpTimeSheetDocument>> {
        let queryToApply: any = {};
        if (req.query && req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);

            queryToApply.weekStartDate = {
                $gte: startDate,
                $lte: endDate,
            };
            delete queryToApply.startDate;
            delete queryToApply.endDate;
        }
        if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
            const amountRangeQuery: any = {};

            if (req.query.minAmount > 0) {
                amountRangeQuery.$gte = req.query.minAmount;
            }
            if (req.query.maxAmount > 0) {
                amountRangeQuery.$lte = req.query.maxAmount;
            }
            queryToApply.totalAmount = amountRangeQuery;
        }

        if (req.query.restaurantIds) {
            queryToApply.restaurantId = {
                $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
            };
        }


        const emps = await this.emphourlyPag.paginate(
            { supplierId: req.user.supplierId, ...queryToApply, },
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
                        path: 'timeSheetDetails.empId',
                        model: 'Emp',
                    },
                ]
            },
        );
        return emps;
    }

    async findOne(empId: string): Promise<EmpTimeSheetDocument> {
        const exists = await this.emphourlyModel.findById(empId);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        empId: string,
        dto: UpdateEmpHourlyTimeSheetDto,
    ): Promise<EmpTimeSheetDocument> {
        const emp = await this.emphourlyModel.findByIdAndUpdate(
            empId,
            dto,
            {
                new: true,
            },
        );

        if (!emp) {
            throw new NotFoundException();
        }

        return emp;
    }

    async remove(empId: string): Promise<boolean> {
        const emp = await this.emphourlyModel.findByIdAndRemove(
            empId,
        );

        if (!emp) {
            throw new NotFoundException();
        }
        return true;
    }

    async getPayRollAmount(req: any, restaurantId: string) {

        const allEmp = await this.empModel.find({
            supplierId: req.user.supplierId,
            restaurantId: new mongoose.Types.ObjectId(restaurantId)
        });

        const monthlySalarySum = await this.empModel.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                    restaurantId: new mongoose.Types.ObjectId(restaurantId)
                },
            },
            {
                $group: {
                    _id: null,
                    totalMonthlySalary: {
                        $sum: '$monthlySalary',
                    },
                },
            },
        ]);
      
        const startOfMonth = moment().set({ year: req.query.yearNumber, month: req.query.monthNumber - 1, date: 1 }).startOf('day');
        const endOfMonth = moment(startOfMonth).endOf('month');

        const empHourlyResult = await this.emphourlyModel.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                    restaurantId: new mongoose.Types.ObjectId(restaurantId),
                    weekStartDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
                },
            },
            {
                $unwind: '$timeSheetDetails',
            },
            {
                $unwind: '$timeSheetDetails.timeSheetDetailsItemData',
            },
            {
                $group: {
                    _id: '$timeSheetDetails.empId',
                    totalHourTotal: { $sum: '$timeSheetDetails.timeSheetDetailsItemData.hourTotal' },
                },
            },
        ]);
        const grandTotalHourTotal = empHourlyResult.reduce((total, empResult) => total + (empResult.totalHourTotal || 0), 0);

        const resp = allEmp
            .map(el => ({
                empId: el._id,
                name: el.name,
                monthlySalary: el.monthlySalary || 0,
                payPlan: el.payPlan,
                hourlyRate: el.hourlyRate || 0,
                hourlyAmount: empHourlyResult.find((f: any) => f._id == el._id)?.totalHourTotal || 0
            }))
            .sort((a, b) => b.monthlySalary - a.monthlySalary);


        resp.push({
            empId: null,
            name: 'Total',
            monthlySalary: (monthlySalarySum.length > 0 ? monthlySalarySum[0].totalMonthlySalary : 0) + grandTotalHourTotal,
            payPlan: EmployeePayPlan.Monthly,
            hourlyRate: 0,
            hourlyAmount: grandTotalHourTotal
        });
        return resp;
    }

    async submitPayRoll(req: any, dto: QueryPayRollDto): Promise<any> {
        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.empMonthlyModel.findOne(
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('PM-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'PM-' + postFix + String(counter).padStart(5, '0');

        const empMonthlydoc = await this.empMonthlyModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
            docNumber: _docNumber
        });

        await this.glVoucherHelperService.handleMonthlyTimeSheet(empMonthlydoc);
        return empMonthlydoc;
    }

    async findAllMonthlyPayRoll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpMonthlySalaryDocument>> {
        let queryToApply: any = {};
        if (req.query && req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);

            queryToApply.date = {
                $gte: startDate,
                $lte: endDate,
            };
            delete queryToApply.startDate;
            delete queryToApply.endDate;
        }
        if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
            const amountRangeQuery: any = {};

            if (req.query.minAmount > 0) {
                amountRangeQuery.$gte = req.query.minAmount;
            }
            if (req.query.maxAmount > 0) {
                amountRangeQuery.$lte = req.query.maxAmount;
            }
            queryToApply.totalAmount = amountRangeQuery;
        }

        if (req.query.restaurantIds) {
            queryToApply.restaurantId = {
                $in: req.query.restaurantIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
            };
        }
        // if (req.query.employeeIds) {
        //     queryToApply['timeSheetDetails.empId'] =
        //         new mongoose.Types.ObjectId(req.query.employeeIds)

        // }
        const emps = await this.empMonthlyModelPeg.paginate(
            { supplierId: req.user.supplierId, ...queryToApply },
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
                        path: 'glAccountId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            glNumber: 1,
                            _id: 1,
                        },
                    },
                    {
                        path: 'glVoucherId'
                    },
                    {
                        path: 'timeSheetDetails.empId',
                        model: 'Emp',
                    },
                ]
            },
        );
        return emps;
    }

}
