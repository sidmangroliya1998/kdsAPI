
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { ChartOfAccount, ChartOfAccountDocument } from './schemas/chart-of-account.schema';
import { ReportingGroupDto } from './dto/reporting-group-dto';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { DefaultSort, PaginationDto, pagination } from 'src/core/Constants/pagination';
import { OperationType } from 'src/accounting-report-template/enum/en.enum';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { GlLineType } from 'src/accounting/enum/en.enum';
import { GlVoucher, GlVoucherDocument } from 'src/accounting/schemas/gl-voucher.schema';
import { GlAccount, GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';
import { GlAccountSet, GlAccountSetDocument } from 'src/gl-account-set/schemas/gl-account-set.schema';
import { ReportDto, SimplifiedReportDto } from 'src/accounting-report-template/dto/report.dto';
import { Aggregate, ReportingGroup } from './schemas/reporting-group.schema';
import { COAReportDto } from './dto/gl-report.dto';
import { TIMEZONE } from 'src/core/Constants/system.constant';

@Injectable()
export class ChartOfAccountService {

    constructor(
        @InjectModel(ChartOfAccount.name)
        private readonly chartofaccountModel: Model<ChartOfAccountDocument>,
        @InjectModel(ChartOfAccount.name)
        private readonly chartofaccountModelPeg: PaginateModel<ChartOfAccountDocument>,
        @InjectModel(GlVoucher.name)
        private readonly glVoucherModel: Model<GlVoucherDocument>,
        @InjectModel(GlAccount.name)
        private readonly glAccountModel: Model<GlAccountDocument>,
        @InjectModel(GlAccountSet.name)
        private readonly glAccountSetModel: Model<GlAccountSetDocument>,
    ) { }
    async create(
        req: any,
        dto: CreateChartOfAccountDto,
    ): Promise<ChartOfAccountDocument> {

        const existId = await this.chartofaccountModel.find({
            supplierId: req.user.supplierId
        });
        console.log("existId", existId)
        if (existId && existId?.length > 0) {
            await this.chartofaccountModel.findByIdAndRemove(existId[0]._id);
        }
        dto.reportingGroup.forEach((rg) => {
            rg.indent = 0;
            if (rg.children?.length > 0)
                rg.children = this.processRecursive(rg.children, 1);
        });
        return await this.chartofaccountModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
    }

    async createQuick(req: any, dto: any): Promise<any> {
        return await this.chartofaccountModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
    }


    processRecursive(children: ReportingGroupDto[], index) {
        children.forEach((c) => {
            c.indent = index;
            if (c.children?.length > 0) {
                c.children = this.processRecursive(c.children, index + 1);
            }
        });
        return children;
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<ChartOfAccountDocument>> {
        const coaData =
            await this.chartofaccountModelPeg.paginate(
                { supplierId: req.user.supplierId },
                {
                    sort: DefaultSort,
                    lean: true,
                    ...paginateOptions,
                    ...pagination,
                },
            );
        return coaData;
    }
    async createCOAReport(req, dto): Promise<any> {
        const existId = await this.chartofaccountModel.find({
            supplierId: req.user.supplierId
        });
        if (existId) {
            const reportGroup = existId[0]['reportingGroup'];
            const glSetData = await this.glAccountSetModel.find({
                supplierId: req.user.supplierId
            });

            const newGLSetData = await Promise.all(glSetData.map(async (el: any) => {
                let respEachGLSetData = [];

                if (el?.glAccountIds && el.glAccountIds?.length > 0) {
                    respEachGLSetData = await this.fetchReportData(
                        req,
                        {
                            glAccountIds: el?.glAccountIds,
                        },
                        dto
                    );
                }
                return {
                    _id: el._id,
                    reportData: respEachGLSetData
                };
            }));

            reportGroup.forEach(async (reportingGroup: any) => {
                await this.updateIsGLSet(reportingGroup, newGLSetData);
            });
            return reportGroup;
        }
        return [];
    }

    async createTrialBalReport(req, dto) {
        const existId = await this.chartofaccountModel.find({
            supplierId: req.user.supplierId
        });
        const response = []

        if (existId && existId.length > 0) {
            const reportGroup = existId[0]['reportingGroup'];
            const glSetData = await this.glAccountSetModel.find({
                supplierId: req.user.supplierId
            });

            const newGLSetData = await Promise.all(glSetData.map(async (el: any) => {
                let respEachGLSetData = [];

                if (el?.glAccountIds && el.glAccountIds?.length > 0) {
                    respEachGLSetData = await this.fetchReportDataTrialBal(
                        req,
                        {
                            glAccountIds: el?.glAccountIds,
                        },
                        dto
                    );
                }
                return {
                    _id: el._id,
                    reportData: respEachGLSetData
                };
            }));

            reportGroup.forEach(async (reportingGroup: any) => {
                await this.updateIsGLSet(reportingGroup, newGLSetData);
            });

            // Calculate overall totals for each property in the reportData arrays
            const overallTotals: any = {};
            reportGroup.forEach(reportingGroup => {
                this.calculateOverallTotals(reportingGroup, overallTotals);
            });
            response.push(
                {
                    reportGroup,
                    overallTotals
                }
            )

            return response;
        }

        return response;
    }
    async updateIsGLSet(reportingGroup: any, glSetData: any) {
        if (reportingGroup.glAccountSetId) {
            reportingGroup.isGLSet = true;
            const glAccountSet = glSetData.find((f: any) => f._id.toString() == reportingGroup.glAccountSetId);

            if (glAccountSet) {
                reportingGroup.reportData = glAccountSet.reportData;
            }
        } else {
            reportingGroup.isGLSet = false;
        }

        if (reportingGroup.children && reportingGroup.children.length > 0) {
            reportingGroup.children.forEach(async (child: any) => {
                await this.updateIsGLSet(child, glSetData);
            });
        }
    }
    async fetchReportData(
        req,
        query: any,
        dto: COAReportDto
    ) {

        let queryToApply: any = {};
        if (dto.startDate && dto.endDate) {
            dto.startDate.setUTCHours(0);
            dto.startDate.setUTCMinutes(0);

            dto.endDate.setUTCHours(23);
            dto.endDate.setUTCMinutes(59);

            queryToApply.createdAt = {
                $gte: dto.startDate,
                $lte: dto.endDate,
            };
        }
        const glAccountVouchers = await this.glVoucherModel.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                    ...queryToApply
                },
            },
            {
                $project: {
                    items: {
                        $filter: {
                            input: '$items',
                            as: 'item',
                            cond: {
                                $in: [
                                    '$$item.glAccountId',
                                    query.glAccountIds.map(
                                        (id) => new mongoose.Types.ObjectId(id.toString()),
                                    ),
                                ],
                            },
                        },
                    },
                    // y: { $year: { date: '$createdAt' } },
                    // m: { $month: { date: '$createdAt' } },
                },
            },
            {
                $unwind: '$items',
            },
            {
                $group: {
                    _id: '$items.glAccountId',
                    credit: {
                        $sum: {
                            $cond: [
                                { $eq: ['$items.glLineType', GlLineType.CR] },
                                '$items.amount',
                                0,
                            ],
                        },
                    },
                    debit: {
                        $sum: {
                            $cond: [
                                { $eq: ['$items.glLineType', GlLineType.DR] },
                                '$items.amount',
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        const response = [];
        for (const i in glAccountVouchers) {
            const glAccount = await this.glAccountModel.findById(
                glAccountVouchers[i]._id,
            );
            let total = glAccountVouchers[i].debit - glAccountVouchers[i].credit;
            response.push({
                ...glAccountVouchers[i],
                glAccountName: glAccount?.name ?? null,
                glAccountNameAr: glAccount?.nameAr ?? null,
                glAccountNumber: glAccount?.glNumber ?? null,
                total: roundOffNumber(total),
            });
        }

        return response;
    }

    async fetchReportDataTrialBal(req, query: any, dto: COAReportDto) {
        let queryToApply: any = {};
        if (dto.startDate && dto.endDate) {
            dto.startDate.setUTCHours(0);
            dto.startDate.setUTCMinutes(0);

            dto.endDate.setUTCHours(23);
            dto.endDate.setUTCMinutes(59);

            queryToApply.createdAt = {
                $gte: dto.startDate,
                $lte: dto.endDate,
            };
        }

        const glAccountVouchers = await this.glVoucherModel.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                    ...queryToApply
                },
            },
            {
                $project: {
                    items: {
                        $filter: {
                            input: '$items',
                            as: 'item',
                            cond: {
                                $in: [
                                    '$$item.glAccountId',
                                    query.glAccountIds.map((id: any) => new mongoose.Types.ObjectId(id.toString())),
                                ],
                            },
                        },
                    },
                },
            },
            {
                $unwind: '$items',
            },
            {
                $group: {
                    _id: '$items.glAccountId',
                    credit: {
                        $sum: {
                            $cond: [
                                { $eq: ['$items.glLineType', GlLineType.CR] },
                                '$items.amount',
                                0,
                            ],
                        },
                    },
                    debit: {
                        $sum: {
                            $cond: [
                                { $eq: ['$items.glLineType', GlLineType.DR] },
                                '$items.amount',
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const responseMap = new Map();

        for (const glAccountVoucher of glAccountVouchers) {
            const { _id, debit, credit } = glAccountVoucher;

            const glAccount = await this.glAccountModel.findById(_id);

            const total = debit - credit;
            const debitAmount = debit;
            const creditAmount = credit;
            responseMap.set(_id, {
                ...glAccountVoucher,
                glAccountName: glAccount?.name ?? null,
                glAccountNameAr: glAccount?.nameAr ?? null,
                glAccountNumber: glAccount?.glNumber ?? null,
                openingBalDebit: 0,
                openingBalCredit: 0,
                movementDebit: debit,
                movementCredit: credit,
                netMovementDebit: debitAmount > creditAmount ? (debitAmount - creditAmount) : 0,
                netMovementCredit: debitAmount < creditAmount ? (creditAmount - debitAmount) : 0,
                closingBalDebit: debitAmount > creditAmount ? (debitAmount - creditAmount) : 0,
                closingBalCredit: debitAmount < creditAmount ? (creditAmount - debitAmount) : 0,
                total: roundOffNumber(total),
            });
        }

        return Array.from(responseMap.values());
    }
    calculateOverallTotals(reportingGroup: any, overallTotals: any) {
        if (reportingGroup.reportData) {
            reportingGroup.reportData.forEach((reportData: any) => {
                if (reportData._id !== 'totals' && reportData._id !== 'overallTotals') {
                    overallTotals.movementDebit = (overallTotals.movementDebit || 0) + reportData.movementDebit;
                    overallTotals.movementCredit = (overallTotals.movementCredit || 0) + reportData.movementCredit;
                    overallTotals.netMovementDebit = (overallTotals.netMovementDebit || 0) + reportData.netMovementDebit;
                    overallTotals.netMovementCredit = (overallTotals.netMovementCredit || 0) + reportData.netMovementCredit;
                    overallTotals.closingBalDebit = (overallTotals.closingBalDebit || 0) + reportData.closingBalDebit;
                    overallTotals.closingBalCredit = (overallTotals.closingBalCredit || 0) + reportData.closingBalCredit;
                    overallTotals.total = (overallTotals.total || 0) + reportData.total;
                }
            });
        }

        if (reportingGroup.children && reportingGroup.children.length > 0) {
            reportingGroup.children.forEach((child: any) => {
                this.calculateOverallTotals(child, overallTotals);
            });
        }
    }
}