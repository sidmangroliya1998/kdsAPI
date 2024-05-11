import { GlVoucher, GlVoucherDocument } from "src/accounting/schemas/gl-voucher.schema";
import { BalanceSheetTemplate, BalanceSheetTemplateDocument } from "./schema/balance-sheet-template.schema";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { CreateBalanceSheetTemplateDto } from "./dto/create-balance-sheet-template.dto";
import { UpdateBalanceSheetTemplateDto } from "./dto/update-balance-sheet-template.dto";
import { BalanceSheetReportDto } from "./dto/balance-report.dto";
import { GlLineType } from "src/accounting/enum/en.enum";
import { ReportType } from "src/profit-loss-cal/enum/en";
import * as moment from 'moment';

@Injectable()
export class BalanceSheetService {
    constructor(
        @InjectModel(BalanceSheetTemplate.name)
        private readonly balanceSheetModel: Model<BalanceSheetTemplateDocument>,
        @InjectModel(GlVoucher.name)
        private readonly glVoucherModel: Model<GlVoucherDocument>
    ) { }

    async defaultTemplate(req: any): Promise<any> {

        const dto: CreateBalanceSheetTemplateDto = {
            name: "Balance Sheet",
            nameAr: "القائمة المالية",
            assets: {
                indent: 0,
                currentAsset: {
                    name: "Current Assets",
                    nameAr: "لأصول الجارية",
                    indent: 1,
                    glAccountIds: [],
                    children: []
                },
                fixedAsset: {
                    name: "Fixed Assets",
                    nameAr: "الأصول الثابتة",
                    indent: 1,
                    glAccountIds: [],
                    children: []
                }
            },
            liabilityAndEquity: {
                indent: 0,
                liabilities: {
                    name: "Liabilities",
                    nameAr: "المطلوبات",
                    indent: 1,
                    glAccountIds: [],
                    children: []
                },
                equity: {
                    name: "Equity",
                    nameAr: "حقوق الملكية",
                    indent: 1,
                    glAccountIds: [],
                    children: []
                }
            }
        }

        const exists = await this.balanceSheetModel.find({
            supplierId: req.user.supplierId,
        });
        if (!exists || exists?.length == 0) {
            return this.createTemplate(req, dto);
        }
        return exists;
    }
    async createTemplate(
        req: any,
        dto: CreateBalanceSheetTemplateDto,
    ): Promise<BalanceSheetTemplateDocument> {
        return await this.balanceSheetModel.create(
            {
                ...dto,
                supplierId: req.user.supplierId,
                addedBy: req.user.userId,
            }
        );
    }

    async findAllTemplate(
        req: any,
    ): Promise<any> {
        const templateData = await this.balanceSheetModel.find(
            {
                supplierId: req.user.supplierId,
            }
        );
        return templateData;
    }

    async findOneTemplate(templateId: string): Promise<BalanceSheetTemplateDocument> {
        const exists = await this.balanceSheetModel.findById(templateId);
        if (!exists) {
            throw new NotFoundException();
        }
        return exists;
    }

    async updateTemplate(
        templateId: string,
        dto: UpdateBalanceSheetTemplateDto,
    ): Promise<BalanceSheetTemplateDocument> {
        const templateData = await this.balanceSheetModel.findByIdAndUpdate(
            templateId,
            dto
        );

        if (!templateData) {
            throw new NotFoundException();
        }
        return templateData;
    }

    async removeTemplate(templateId: string): Promise<boolean> {
        const paymentSetup = await this.balanceSheetModel.findByIdAndRemove(
            templateId,
        );
        if (!paymentSetup) {
            throw new NotFoundException();
        }
        return true;
    }

    async createBalanceSheetReport(req: any, dto: BalanceSheetReportDto) {
        const templateData = await this.balanceSheetModel.find(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            }
        );
        const response: any = [];
        const glDataByAccount = await this.fetchReportData(req, dto);
        let currentAssetReport = [];
        const currentAssetData = await this.getGroupData(dto, [templateData[0]['assets']['currentAsset']], glDataByAccount);

        for (let i = 0; i < currentAssetData.length; i++) {
            const elx = currentAssetData[i];
            currentAssetReport.push(elx);
            if (elx.children && elx.children?.length > 0) {
                currentAssetReport.push(
                    {
                        id: 'total' + elx.name,
                        name: 'Total ' + elx.name,
                        nameAr: 'اجمالي' + elx.nameAr,
                        datewiseData: elx.children.reduce((result, child) => {
                            child.datewiseData.forEach((dateEntry) => {
                                const existingEntryIndex = result.findIndex(
                                    (r) => r.date === dateEntry.date
                                );
                                if (existingEntryIndex !== -1) {
                                    result[existingEntryIndex].totalAmount +=
                                        dateEntry.totalAmount || 0;
                                } else {
                                    result.push({ ...dateEntry });
                                }
                            });

                            return result;
                        }, [] as any[]),
                        total: elx.children.reduce((sum, child) => sum + child.total, 0),
                        children: [],
                        indent: elx.indent,
                        isSummary: true
                    }
                )
            }
        }

        let fixedAssetReport = [];
        const fixedAssetData = await this.getGroupData(dto, [templateData[0]['assets']['fixedAsset']], glDataByAccount, true);
        for (let i = 0; i < fixedAssetData.length; i++) {
            const elx = fixedAssetData[i];
            fixedAssetReport.push(elx);
            if (elx.children && elx.children?.length > 0) {
                fixedAssetReport.push(
                    {
                        id: 'total' + elx.name,
                        name: 'Total ' + elx.name,
                        nameAr: 'اجمالي' + elx.nameAr,
                        datewiseData: elx.children.reduce((result, child) => {
                            child.datewiseData.forEach((dateEntry) => {
                                const existingEntryIndex = result.findIndex(
                                    (r) => r.date === dateEntry.date
                                );
                                if (existingEntryIndex !== -1) {
                                    result[existingEntryIndex].totalAmount +=
                                        dateEntry.totalAmount || 0;
                                } else {
                                    result.push({ ...dateEntry });
                                }
                            });

                            return result;
                        }, [] as any[]),
                        total: elx.children.reduce((sum, child) => sum + child.total, 0),
                        children: [],
                        indent: elx.indent,
                        isSummary: true
                    }
                )
            }
        }


        const getCurrentSummariesData = currentAssetReport.filter((f: any) => f.isSummary);
        const getFixedSummariesData = fixedAssetReport.filter((f: any) => f.isSummary);

        const finalAssetSummary = {
            id: 'total',
            name: 'TOTAL ASSETS',
            nameAr: 'إجمالي الأصول',
            datewiseData: getCurrentSummariesData.reduce((result, summary) => {
                summary.datewiseData.forEach((dateEntry) => {
                    const existingEntryIndex = result.findIndex((r) => r.date === dateEntry.date);
                    if (existingEntryIndex !== -1) {
                        result[existingEntryIndex].totalAmount += Number(dateEntry.totalAmount) || 0;
                    } else {
                        result.push({ ...dateEntry });
                    }
                });
                return result;
            }, [] as any[]),
            total: getCurrentSummariesData.reduce((sum, summary) => sum + Number(summary.total), 0) +
                getFixedSummariesData.reduce((sum, summary) => sum + Number(summary.total), 0),
            children: [],
            indent: 0,
            isSummary: true
        };


        let liabilityReport = [];
        const liabilitiesData = await this.getGroupData(dto, [templateData[0]['liabilityAndEquity']['liabilities']], glDataByAccount, true);

        for (let i = 0; i < liabilitiesData.length; i++) {
            const elx = liabilitiesData[i];
            liabilityReport.push(elx);
            if (elx.children && elx.children?.length > 0) {
                liabilityReport.push(
                    {
                        id: 'total' + elx.name,
                        name: 'Total ' + elx.name,
                        nameAr: 'اجمالي' + elx.nameAr,
                        datewiseData: elx.children.reduce((result, child) => {
                            child.datewiseData.forEach((dateEntry) => {
                                const existingEntryIndex = result.findIndex(
                                    (r) => r.date === dateEntry.date
                                );
                                if (existingEntryIndex !== -1) {
                                    result[existingEntryIndex].totalAmount +=
                                        dateEntry.totalAmount || 0;
                                } else {
                                    result.push({ ...dateEntry });
                                }
                            });

                            return result;
                        }, [] as any[]),
                        total: elx.children.reduce((sum, child) => sum + child.total, 0),
                        children: [],
                        indent: elx.indent,
                        isSummary: true
                    }
                )
            }
        }
        let equityReport = [];
        const equityData = await this.getGroupData(dto, [templateData[0]['liabilityAndEquity']['equity']], glDataByAccount);
        for (let i = 0; i < equityData.length; i++) {
            const elx = equityData[i];
            equityReport.push(elx);
            if (elx.children && elx.children?.length > 0) {
                equityReport.push(
                    {
                        id: 'total' + elx.name,
                        name: 'Total ' + elx.name,
                        nameAr: 'اجمالي' + elx.nameAr,
                        datewiseData: elx.children.reduce((result, child) => {
                            child.datewiseData.forEach((dateEntry) => {
                                const existingEntryIndex = result.findIndex(
                                    (r) => r.date === dateEntry.date
                                );
                                if (existingEntryIndex !== -1) {
                                    result[existingEntryIndex].totalAmount +=
                                        dateEntry.totalAmount || 0;
                                } else {
                                    result.push({ ...dateEntry });
                                }
                            });

                            return result;
                        }, [] as any[]),
                        total: elx.children.reduce((sum, child) => sum + child.total, 0),
                        children: [],
                        indent: elx.indent,
                        isSummary: true
                    }
                )
            }
        }
        const getLibSummariesData = liabilityReport.filter((f: any) => f.isSummary);
        const getEquitySummariesData = equityReport.filter((f: any) => f.isSummary);
        const finalLiabilityAndEquitySummary = {
            id: 'total',
            name: 'TOTAL LIABILITIES AND EQUITY',
            nameAr: 'إجمالي المطلوبات وحقوق الملكية',
            datewiseData: getLibSummariesData.reduce((result, summary) => {
                summary.datewiseData.forEach((dateEntry) => {
                    const existingEntryIndex = result.findIndex((r) => r.date === dateEntry.date);
                    if (existingEntryIndex !== -1) {
                        result[existingEntryIndex].totalAmount += Number(dateEntry.totalAmount) || 0;
                    } else {
                        result.push({ ...dateEntry });
                    }
                });
                return result;
            }, [] as any[]),
            total: getLibSummariesData.reduce((sum, summary) => sum + Number(summary.total), 0) +
                getEquitySummariesData.reduce((sum, summary) => sum + Number(summary.total), 0),
            children: [],
            indent: 0,
            isSummary: true
        };

        response.push({
            currentAssetData: currentAssetReport,
            fixedAssetData: fixedAssetReport,
            assetSummary: finalAssetSummary,
            liabilitiesData: liabilityReport,
            equityData: equityReport,
            liabilityAndEquitySummary: finalLiabilityAndEquitySummary
        });
        return response;

    }

    async getGroupData(dto, groupData, glDataByAccount, isNegative = false) {

        const calculateNestedGroupData = async (group) => {
            const nestedGroupData = await Promise.all(
                group.map(async (el) => {
                    const glAccountIds = el.glAccountIds || [];
                    const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount,
                        glAccountIds, dto);
                    const total = datewiseData.reduce((sum, entry) => sum + Number(entry.totalAmount), 0);
                    const childrenData = el.children ? await calculateNestedGroupData(el.children) : [];
                    return {
                        id: el.name,
                        name: el.name,
                        nameAr: el.nameAr,
                        datewiseData,
                        total: isNegative ? -1 * total : total,
                        children: childrenData,
                        indent: el.indent,
                        isSummary: false,
                    };
                })
            );

            return nestedGroupData;
        };

        const respGroupData = await calculateNestedGroupData(groupData);
        return respGroupData;
    }

    async aggregateAndSumByDate(startDate, endDate, glData, glAccountIds, dto) {
        const datewiseData = [];

        for (let date = moment(startDate); date.isSameOrBefore(endDate); date.add(1, 'day')) {
            const formattedDate = date.format('YYYY-MM-DD');

            const filteredData = glData.filter(item =>
                glAccountIds.includes(item._id.glAccountId?.toString()) && item._id.date === formattedDate
            );

            const sumCredit = filteredData.reduce((sum, entry) => sum + Number(entry.credit), 0);
            const sumDebit = filteredData.reduce((sum, entry) => sum + Number(entry.debit), 0);

            datewiseData.push({
                date: formattedDate,
                sumCredit,
                sumDebit,
                totalAmount: Math.abs(sumCredit - sumDebit)
            });
        }

        const transformedData: any = datewiseData.reduce((result, entry) => {
            const { date, sumCredit, sumDebit, totalAmount } = entry;
            let dateKey;

            switch (dto.timeFlag) {
                case ReportType.QUARTERLY:
                    dateKey = this.getQuarterFromDate(new Date(date));
                    break;
                case ReportType.MONTHLY:
                    dateKey = new Date(date).toLocaleString('en-us', { month: 'short' });
                    break;
                case ReportType.ANNUALLY:
                    dateKey = new Date(date).getFullYear().toString();
                    break;
                default:
                    dateKey = date;
            }
            result[dateKey] = result[dateKey] || { debit: 0, credit: 0, totalAmount: 0 };
            result[dateKey].debit += sumDebit;
            result[dateKey].credit += sumCredit;
            result[dateKey].totalAmount += totalAmount;
            return result;
        }, {});

        const transformedArray: { date: string, debit: number, credit: number, totalAmount: number }[] =
            Object.entries(transformedData).map(([date, values]) => ({
                date,
                debit: (values as { debit: number }).debit,
                credit: (values as { credit: number }).credit,
                totalAmount: (values as { totalAmount: number }).totalAmount,
            }));

        if (dto.timeFlag === ReportType.QUARTERLY) {
            const quarterlyResult = [
                { date: 'Q1', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Q2', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Q3', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Q4', debit: 0, credit: 0, totalAmount: 0 },
            ];

            transformedArray.forEach(entry => {
                const quarter = parseInt(entry.date.charAt(1));
                quarterlyResult[quarter - 1].debit += entry.debit;
                quarterlyResult[quarter - 1].credit += entry.credit;
                quarterlyResult[quarter - 1].totalAmount += entry.totalAmount;
            });

            const startQuarter = moment(startDate).quarter();
            const endQuarter = moment(endDate).quarter();

            const filteredResult = quarterlyResult.slice(startQuarter - 1, endQuarter);

            return filteredResult;
        }
        else if (dto.timeFlag === ReportType.MONTHLY) {

            const monthlyResult = [
                { date: 'Jan', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Feb', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Mar', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Apr', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'May', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Jun', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Jul', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Aug', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Sep', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Oct', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Nov', debit: 0, credit: 0, totalAmount: 0 },
                { date: 'Dec', debit: 0, credit: 0, totalAmount: 0 },
            ];

            transformedArray.forEach(entry => {
                const monthIndex = new Date(entry.date + ' 1, 2000').getMonth();
                monthlyResult[monthIndex].debit += entry.debit;
                monthlyResult[monthIndex].credit += entry.credit;
                monthlyResult[monthIndex].totalAmount += entry.totalAmount;
            });

            const startMonth = moment(startDate).month();
            const endMonth = moment(endDate).month();

            const filteredResult = monthlyResult.slice(startMonth, endMonth + 1);

            return filteredResult;
        }
        else if (dto.timeFlag === ReportType.ANNUALLY) {
            const startYear = transformedArray.length > 0 ? parseInt(transformedArray[0].date) : new Date().getFullYear();
            const endYear = transformedArray.length > 0 ? parseInt(transformedArray[transformedArray.length - 1].date) : new Date().getFullYear();

            const yearlyResult = Array.from({ length: endYear - startYear + 1 }, (_, index) => {
                const year = startYear + index;
                const yearData = transformedArray.filter(entry => parseInt(entry.date) === year);
                const totalDebit = yearData.reduce((sum, entry) => sum + entry.debit, 0);
                const totalCredit = yearData.reduce((sum, entry) => sum + entry.credit, 0);
                const totalAmount = yearData.reduce((sum, entry) => sum + entry.totalAmount, 0);
                return { date: year.toString(), debit: totalDebit, credit: totalCredit, totalAmount: totalAmount };
            });

            return yearlyResult;
        }

        return transformedArray;
    }
    async fetchReportData(
        req,
        dto: BalanceSheetReportDto,
        query = '',
    ) {

        let queryToApply: any = {};
        if (dto.startDate && dto.endDate) {
            dto.startDate.setUTCHours(0);
            dto.startDate.setUTCMinutes(0);

            dto.endDate.setUTCHours(23);
            dto.endDate.setUTCMinutes(59);

            queryToApply.date = {
                $gte: dto.startDate,
                $lte: dto.endDate,
            };
        }
        if (query && query != '') {
            queryToApply.type = query; // Assuming `query` is the value you want to filter on for the "type" field
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
                    items: 1,
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                },
            },
            {
                $unwind: '$items',
            },
            {
                $group: {
                    _id: {
                        glAccountId: '$items.glAccountId',
                        date: '$date',
                    },
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
        return glAccountVouchers;
    }
    getQuarterFromDate(date: Date): string {
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        return `Q${quarter}`;
    }

}