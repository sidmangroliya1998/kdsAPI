import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import * as moment from 'moment';
import { GlVoucher, GlVoucherDocument } from "src/accounting/schemas/gl-voucher.schema";
import { EmpTimeSheet, EmpTimeSheetDocument } from "src/employee-mgmt/schemas/emp-hourly-timesheet.schema";
import { Emp, EmpDocument } from "src/employee-mgmt/schemas/emp.schema";
import { ProfitLossTemplate, ProfitLossTemplateDocument } from "./schemas/profit-loss-schema";
import { CreateProfitLossTemplateDto } from "./dto/create-profit-loss-template.dto";
import { UpdateProfitLossTemplateDto } from "./dto/update-profit-loss-template";
import { ProfitLossReportDto } from './dto/profit-loss-report.dto';
import { GlLineType } from 'src/accounting/enum/en.enum';
import { EmployeePayPlan } from 'src/employee-mgmt/enum/en';
import { ReportType } from './enum/en';

@Injectable()
export class ProfitLossService {
    constructor(
        @InjectModel(ProfitLossTemplate.name)
        private readonly profitLossModel: Model<ProfitLossTemplateDocument>,
        @InjectModel(GlVoucher.name)
        private readonly glVoucherModel: Model<GlVoucherDocument>,
        @InjectModel(EmpTimeSheet.name)
        private readonly emphourlyModel: Model<EmpTimeSheetDocument>,
        @InjectModel(Emp.name)
        private readonly empModel: Model<EmpDocument>,

    ) { }
    async defaultTemplate(req: any): Promise<any> {

        const dto: CreateProfitLossTemplateDto = {
            "name": "Profit & Loss Template",
            "nameAr": "قالب الربح والخسارة",
            "profitLossSalesGroup": [
                {
                    "name": "Food & Soft Beverage",
                    "nameAr": "الطعام والمشروبات",
                    "indent": 0,
                    "glAccountIds": [],
                    "code": "FOOD"
                },
                {
                    "name": "Merchandise & Other",
                    "nameAr": "البضائع والأخرى",
                    "indent": 0,
                    "glAccountIds": [],
                    "code": "MERCHANDISE"
                }
            ],
            "profitLossCogsGroup": [
                {
                    "name": "Food",
                    "nameAr": "الطعام",
                    "indent": 0,
                    "glAccountIds": [],
                    "salesGroupId": null,
                    "children": [
                        {
                            "name": "Food",
                            "nameAr": "الطعام",
                            "indent": 1,
                            "glAccountIds": [],
                            "salesGroupId": "FOOD",
                            "children": []
                        },
                        {
                            "name": "Soft Beverage",
                            "nameAr": "المشروبات",
                            "indent": 1,
                            "glAccountIds": [],
                            "salesGroupId": "FOOD",
                            "children": []
                        }
                    ],

                },
                {
                    "name": "Others",
                    "nameAr": "الآخرين",
                    "indent": 0,
                    "glAccountIds": [],
                    "salesGroupId": null,
                    "children": [
                        {
                            "name": "Paper",
                            "nameAr": "الورق",
                            "indent": 1,
                            "glAccountIds": [],
                            "salesGroupId": "MERCHANDISE",
                            "children": []
                        },
                        {
                            "name": "Merchandise & Other",
                            "nameAr": "البضائع والأخرى",
                            "indent": 1,
                            "glAccountIds": [],
                            "salesGroupId": "MERCHANDISE",
                            "children": []
                        }
                    ]
                }
            ],
            "profitLossLaborGroup": [
                {
                    "name": "Monthly",
                    "nameAr": "الشهري",
                    "indent": 0,
                    "glAccountIds": [],
                    "salesGroupId": null
                },
                {
                    "name": "Hourly Personnel",
                    "nameAr": "فريق العمل بالساعة",
                    "indent": 0,
                    "glAccountIds": [],
                    "salesGroupId": null
                }
            ],
            "profitLossControllableExpense": [
                {
                    "name": "Other Controllable Expense",
                    "nameAr": "مصروفات أخرى قابلة للتحكم",
                    "indent": 0,
                    "glAccountIds": []
                }
            ],
            "profitLossNonControllableExpense": [
                {
                    "name": "Other Non-Controllable Expense",
                    "nameAr": "مصروفات أخرى غير قابلة للتحكم",
                    "indent": 0,
                    "glAccountIds": []
                }

            ],
            "profitLossOther": [
                {
                    "name": "Other",
                    "nameAr": "أخرى ",
                    "indent": 0,
                    "glAccountIds": []
                }

            ]
        }
        const exists = await this.profitLossModel.find({
            supplierId: req.user.supplierId,
        });
        if (!exists || exists?.length == 0) {
            return this.createTemplate(req, dto);
        }
        return exists;
    }

    async createTemplate(
        req: any,
        dto: CreateProfitLossTemplateDto,
    ): Promise<ProfitLossTemplateDocument> {
        return await this.profitLossModel.create(
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
        const templateData = await this.profitLossModel.find(
            {
                supplierId: req.user.supplierId,
            }
        );
        return templateData;
    }

    async findOneTemplate(templateId: string): Promise<ProfitLossTemplateDocument> {
        const exists = await this.profitLossModel.findById(templateId);
        if (!exists) {
            throw new NotFoundException();
        }
        return exists;
    }

    async updateTemplate(
        templateId: string,
        dto: UpdateProfitLossTemplateDto,
    ): Promise<ProfitLossTemplateDocument> {
        const templateData = await this.profitLossModel.findByIdAndUpdate(
            templateId,
            dto
        );

        if (!templateData) {
            throw new NotFoundException();
        }
        return templateData;
    }

    async removeTemplate(templateId: string): Promise<boolean> {
        const paymentSetup = await this.profitLossModel.findByIdAndRemove(
            templateId,
        );
        if (!paymentSetup) {
            throw new NotFoundException();
        }
        return true;
    }

    async createReportFromTemplate(req,
        dto: ProfitLossReportDto): Promise<any> {

        const templateData = await this.profitLossModel.find(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            }
        );
        const response: any = [];
        const glDataByAccount = await this.fetchReportData(req, dto);
        const salesGroupResp = await this.getSalesGroupData(templateData, dto, glDataByAccount);
        const totalAmount = salesGroupResp.find((f: any) => f.id == 'totalSales')?.['total'];
        const getCOGSGroupResp = await this.getCOGSGroupData(templateData[0]['profitLossCogsGroup'], dto, glDataByAccount, salesGroupResp, Number(totalAmount));


        let cogsReport = [];
        for (let i = 0; i < getCOGSGroupResp.length; i++) {
            const elx = getCOGSGroupResp[i];
            cogsReport.push(elx);
            if (elx.children && elx.children?.length > 0) {
                cogsReport.push(
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
                        salesgroupId: elx.salesGroupId,
                        isSummary: true,
                        percentage: elx.children.reduce((sum, child) => sum + (Number.isNaN(child.percentage) ? 0 : child.percentage), 0)
                    }
                )
            }
        }

        const getAllSummariesData = cogsReport.filter((f: any) => f.isSummary);

        const finalSummary = {
            id: 'total',
            name: 'TOTAL COST OF SALES',
            nameAr: 'اجمالي تكلفة المبيعات',
            datewiseData: getAllSummariesData.reduce((result, summary) => {
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
            total: getAllSummariesData.reduce((sum, summary) => sum + Number(summary.total), 0),
            children: [],
            indent: 0,
            salesgroupId: null,
            isSummary: true,
            percentage: getAllSummariesData.reduce((sum, summary) => sum + Number(summary.percentage), 0)
        };

        // Add the final summary to cogsReport
        cogsReport.push(finalSummary);


        const hourlySalary = await this.getHourlySalary(req, dto);
        const monthlySalary: any = await this.getEmployeeMonthlySalary(req, dto);
        const monthlySalaryAmount = monthlySalary.reduce((sum, employee) => sum + employee.totalAmount, 0);

        const laborGroup = [
            {
                name: templateData[0]['profitLossLaborGroup'].find((f: any) => f.name.includes('Monthly'))?.name,
                nameAr: templateData[0]['profitLossLaborGroup'].find((f: any) => f.name.includes('Monthly'))?.nameAr,
                salesGroupId: templateData[0]['profitLossLaborGroup'].find((f: any) => f.name.includes('Monthly'))?.salesGroupId,
                datewiseData: [],
                total: monthlySalaryAmount,
                percentage: monthlySalaryAmount / totalAmount
            },
            {
                name: templateData[0]['profitLossLaborGroup'].find((f: any) => f.name.includes('Hourly'))?.name,
                nameAr: templateData[0]['profitLossLaborGroup'].find((f: any) => f.name.includes('Hourly'))?.nameAr,
                salesGroupId: templateData[0]['profitLossLaborGroup'].find((f: any) => f.name.includes('Hourly'))?.salesGroupId,
                datewiseData: hourlySalary,
                total: hourlySalary.reduce((sum, entry) => sum + entry.totalAmount, 0),
                percentage: (hourlySalary.reduce((sum, entry) => sum + entry.totalAmount, 0)) / totalAmount
            },
            {
                name: 'Total',
                nameAr: 'الاجمالي',
                salesGroupId: null,
                datewiseData: hourlySalary,
                total: monthlySalaryAmount +
                    hourlySalary.reduce((sum, entry) => sum + entry.totalAmount, 0),
                percentage: (monthlySalaryAmount +
                    hourlySalary.reduce((sum, entry) => sum + entry.totalAmount, 0)) / totalAmount

            }
        ]
        const primeCostValue = laborGroup.find((f: any) => f.name == 'Total')?.['total'] +
            cogsReport.find((f: any) => f.id == 'total')?.['total'];

        const primeCost = [{
            name: 'PRIME COST',
            nameAr: 'نسبة التكلفة',
            salesGroupId: null,
            datewiseData: [],
            total: primeCostValue,
            percentage: primeCostValue / totalAmount
        }];

        const controllableExpenseResp = await this.getControllableExpenseData(templateData, dto, glDataByAccount, totalAmount);
        const nonControllableExpenseResp = await this.getNonControllableExpenseData(templateData, dto, glDataByAccount, totalAmount);
        const otherExpenseResp = await this.getOtherExpenseData(templateData, dto, glDataByAccount, totalAmount);

        const totalControllableExpense = controllableExpenseResp.find((f: any) => f.id == 'totalControllableExpense');
        const totalNonControllableExpense = nonControllableExpenseResp.find((f: any) => f.id == 'totalNonControllableExpense');
        console.log("totalNonControllableExpense", totalNonControllableExpense);
        const totalotherExpense = otherExpenseResp.find((f: any) => f.id == 'totalOtherExpense');
        console.log("totalotherExpense", totalotherExpense);


        const controllbleIncome = [{
            name: 'CONTROLLABLE INCOME',
            nameAr: '',
            salesGroupId: null,
            datewiseData: [],
            total: totalAmount - (Number(primeCostValue) + Number(totalControllableExpense['total'])),
            percentage: 1 - (Number(primeCost[0]['percentage']) + (Number(totalControllableExpense ?
                totalControllableExpense['percentage'] : 0)))
        }];
        console.log("controllbleIncome", controllbleIncome);

        const restOperatingIncome = [{
            name: 'RESTAURANT OPERATING INCOME',
            nameAr: '',
            salesGroupId: null,
            datewiseData: [],
            total: Number(controllbleIncome[0]['total']) - Number(totalNonControllableExpense['total']),
            percentage: (Number(controllbleIncome[0]['percentage']) - (Number(totalNonControllableExpense['percentage'])))
        }];
        console.log("restOperatingIncome", restOperatingIncome);

        const incomeProfitLoss = [{
            name: 'INCOME BEFORE INCOME TAXES',
            nameAr: '',
            salesGroupId: null,
            datewiseData: [],
            total: Number(restOperatingIncome[0]['total']) - Number(totalotherExpense['total']),
            percentage: (Number(restOperatingIncome[0]['percentage']) - (Number(totalotherExpense['percentage'])))
        }];

        response.push({
            salesGroup: salesGroupResp,
            cogsGroup: cogsReport,
            laborGroup: laborGroup,
            primeCost: primeCost,
            contollableExpense: controllableExpenseResp,
            controllbleIncome: controllbleIncome,
            nonControllableExpense: nonControllableExpenseResp,
            restOperatingIncome: restOperatingIncome,
            otherExpense: otherExpenseResp,
            incomeProfitLoss: incomeProfitLoss
        });
        return response;
    }

    async getSalesGroupData(templateData, dto, glDataByAccount) {
        const salesGroupData = await Promise.all(
            templateData[0]['profitLossSalesGroup'].map(async (el: any) => {
                const glAccountIds = el.glAccountIds;
                const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds, dto);
                const total = datewiseData.reduce((sum, entry) => sum + entry.totalAmount, 0);
                return {
                    id: el._id,
                    name: el.name,
                    nameAr: el.nameAr,
                    datewiseData,
                    total,
                    percentage: 0,
                    code: el.code
                };
            })
        );

        // Calculate summary.datewiseData directly from salesGroupData
        const summaryDatewiseData = salesGroupData.reduce((result, entry) => {
            entry.datewiseData.forEach((dateEntry) => {
                const existingEntry = result.find((r) => r.date === dateEntry.date);
                if (existingEntry) {
                    existingEntry.sumCredit += dateEntry.sumCredit;
                    existingEntry.sumDebit += dateEntry.sumDebit;
                    existingEntry.totalAmount += dateEntry.totalAmount;
                } else {
                    result.push({ ...dateEntry });
                }
            });
            return result;
        }, []);

        // Summary object
        const totalSalesAmount = salesGroupData.reduce((sum, entry) => sum + entry.total, 0);
        salesGroupData.forEach((entry) => {
            entry.percentage = totalSalesAmount !== 0 ? (entry.total / totalSalesAmount) * 100 : 0;
        });

        const summary = {
            id: 'totalSales',
            name: 'Total',
            nameAr: 'الاجمالي',
            datewiseData: summaryDatewiseData,
            total: totalSalesAmount,
            percentage: 100,
            indent: 1
        };

        salesGroupData.push(summary);

        return salesGroupData;
    }

    async getControllableExpenseData(templateData, dto, glDataByAccount, totalAmount) {
        const controllableData = await Promise.all(
            templateData[0]['profitLossControllableExpense'].map(async (el: any) => {
                const glAccountIds = el.glAccountIds;
                const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds, dto);
                const total = datewiseData.reduce((sum, entry) => sum + entry.totalAmount, 0);
                return {
                    id: el._id,
                    name: el.name,
                    nameAr: el.nameAr,
                    datewiseData,
                    total,
                    percentage: 0,
                    code: el.code
                };
            })
        );

        // Calculate summary.datewiseData directly from salesGroupData
        const summaryDatewiseData = controllableData.reduce((result, entry) => {
            entry.datewiseData.forEach((dateEntry) => {
                const existingEntry = result.find((r) => r.date === dateEntry.date);
                if (existingEntry) {
                    existingEntry.sumCredit += dateEntry.sumCredit;
                    existingEntry.sumDebit += dateEntry.sumDebit;
                    existingEntry.totalAmount += dateEntry.totalAmount;
                } else {
                    result.push({ ...dateEntry });
                }
            });
            return result;
        }, []);

        // Summary object
        const total = controllableData.reduce((sum, entry) => sum + entry.total, 0);

        const summary = {
            id: 'totalControllableExpense',
            name: 'Total Controllable Expense',
            nameAr: 'الاجمالي',
            datewiseData: summaryDatewiseData,
            total: total,
            percentage: Number(total / totalAmount),
            indent: 1
        };

        controllableData.push(summary);

        return controllableData;
    }

    async getNonControllableExpenseData(templateData, dto, glDataByAccount, totalAmount) {
        const NoncontrollableData = await Promise.all(
            templateData[0]['profitLossNonControllableExpense'].map(async (el: any) => {
                const glAccountIds = el.glAccountIds;
                const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds, dto);
                const total = datewiseData.reduce((sum, entry) => sum + entry.totalAmount, 0);
                return {
                    id: el._id,
                    name: el.name,
                    nameAr: el.nameAr,
                    datewiseData,
                    total,
                    percentage: 0,
                    code: el.code
                };
            })
        );

        // Calculate summary.datewiseData directly from salesGroupData
        const summaryDatewiseData = NoncontrollableData.reduce((result, entry) => {
            entry.datewiseData.forEach((dateEntry) => {
                const existingEntry = result.find((r) => r.date === dateEntry.date);
                if (existingEntry) {
                    existingEntry.sumCredit += dateEntry.sumCredit;
                    existingEntry.sumDebit += dateEntry.sumDebit;
                    existingEntry.totalAmount += dateEntry.totalAmount;
                } else {
                    result.push({ ...dateEntry });
                }
            });
            return result;
        }, []);

        // Summary object
        const total = NoncontrollableData.reduce((sum, entry) => sum + entry.total, 0);

        const summary = {
            id: 'totalNonControllableExpense',
            name: 'Total NonControllable Expense',
            nameAr: 'الاجمالي',
            datewiseData: summaryDatewiseData,
            total: total,
            percentage: Number(total / totalAmount),
            indent: 1
        };

        NoncontrollableData.push(summary);

        return NoncontrollableData;
    }
    async getOtherExpenseData(templateData, dto, glDataByAccount, totalAmount) {
        const OtherData = await Promise.all(
            templateData[0]['profitLossOther'].map(async (el: any) => {
                const glAccountIds = el.glAccountIds;
                const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds, dto);
                const total = datewiseData.reduce((sum, entry) => sum + entry.totalAmount, 0);
                return {
                    id: el._id,
                    name: el.name,
                    nameAr: el.nameAr,
                    datewiseData,
                    total,
                    percentage: 0,
                    code: el.code
                };
            })
        );

        // Calculate summary.datewiseData directly from salesGroupData
        const summaryDatewiseData = OtherData.reduce((result, entry) => {
            entry.datewiseData.forEach((dateEntry) => {
                const existingEntry = result.find((r) => r.date === dateEntry.date);
                if (existingEntry) {
                    existingEntry.sumCredit += dateEntry.sumCredit;
                    existingEntry.sumDebit += dateEntry.sumDebit;
                    existingEntry.totalAmount += dateEntry.totalAmount;
                } else {
                    result.push({ ...dateEntry });
                }
            });
            return result;
        }, []);

        // Summary object
        const total = OtherData.reduce((sum, entry) => sum + entry.total, 0);

        const summary = {
            id: 'totalOtherExpense',
            name: 'Total Other Expense',
            nameAr: 'الاجمالي',
            datewiseData: summaryDatewiseData,
            total: total,
            percentage: Number(total / totalAmount),
            indent: 1
        };

        OtherData.push(summary);

        return OtherData;
    }

    async getCOGSGroupData(cogsGroup, dto, glDataByAccount, salesGroupResp, totalAmount) {
        const calculateNestedGroupData = async (group) => {
            const nestedGroupData = await Promise.all(
                group.map(async (el) => {
                    const glAccountIds = el.glAccountIds || [];
                    const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds, dto);
                    const total = datewiseData.reduce((sum, entry) => sum + Number(entry.totalAmount), 0);
                    const childrenData = el.children ? await calculateNestedGroupData(el.children) : [];

                    let salesGroupTotal = 0;
                    if (salesGroupResp.find((f: any) => f.code == el.salesGroupId)) {
                        salesGroupTotal = Number(salesGroupResp.find((f: any) => f.code == el.salesGroupId)?.['total']);
                    }

                    return {
                        id: el.name,
                        name: el.name,
                        nameAr: el.nameAr,
                        datewiseData,
                        total,
                        children: childrenData,
                        indent: el.indent,
                        salesgroupId: el.salesGroupId,
                        isSummary: false,
                        percentage: el.salesGroupId && el.salesGroupId != null && el.salesGroupId != '' ?
                            total / salesGroupTotal : Number(total / totalAmount)
                    };
                })
            );

            return nestedGroupData;
        };

        const cogsGroupData = await calculateNestedGroupData(cogsGroup);
        return cogsGroupData;
    }

    async getHourlySalary(req, dto) {
        let queryToApply: any = {};
        if (dto.startDate && dto.endDate) {
            dto.startDate.setUTCHours(0);
            dto.startDate.setUTCMinutes(0);

            dto.endDate.setUTCHours(23);
            dto.endDate.setUTCMinutes(59);

            queryToApply.weekStartDate = {
                $gte: dto.startDate,
                $lte: dto.endDate,
            };
        }
        const empTimeSheetData = await this.emphourlyModel.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                    ...queryToApply
                },
            },
            {
                $unwind: "$timeSheetDetails"
            },
            {
                $unwind: "$timeSheetDetails.timeSheetDetailsItemData"
            },
            {
                $match: {
                    "timeSheetDetails.timeSheetDetailsItemData.timeSheetDate": {
                        $gte: dto.startDate.toISOString().split("T")[0],
                        $lte: dto.endDate.toISOString().split("T")[0],
                    },
                },
            },
            {
                $group: {
                    _id: "$timeSheetDetails.timeSheetDetailsItemData.timeSheetDate",
                    hourTotal: { $sum: "$timeSheetDetails.timeSheetDetailsItemData.hourTotal" }
                }
            },
            {
                $project: {
                    date: '$_id',
                    totalAmount: '$hourTotal'
                }
            }
        ]);

        return empTimeSheetData;
    }

    async getEmployeeMonthlySalary(req, dto) {

        const result = await this.empModel.aggregate([
            {
                $match: {
                    payPlan: EmployeePayPlan.Monthly,
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId)
                }
            },
            {
                $addFields: {
                    empId: '$_id',
                },
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    monthlySalary: 1,
                    payPlan: 1,
                    employementDay: 1,
                    releaseDate: 1,
                    empId: 1,
                    perDaySalary: { $divide: ["$monthlySalary", 30] }
                }
            }
        ]);

        const startDate = new Date(dto.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dto.endDate);
        endDate.setHours(0, 0, 0, 0);

        const _startDate = moment(dto.startDate);
        const _endDate = moment(dto.endDate);

        const differenceInDays = _endDate.diff(_startDate, 'days');


        const uniqueEmployeesSet = new Set();

        // Condition 1
        result
            .filter(employee =>
                employee.employementDay <= startDate && (employee.releaseDate >= endDate || !employee.releaseDate || employee.releaseDate === null)
            )
            .forEach(employee => {
                if (!uniqueEmployeesSet.has(employee.empId)) {
                    uniqueEmployeesSet.add({
                        ...employee,
                        totalAmount: employee.perDaySalary * differenceInDays,
                        condition: 1
                    })
                }
            });

        // Condition 2
        result
            .filter(employee =>
                employee.employementDay >= startDate && (!employee.releaseDate || employee.releaseDate === null)
            )
            .forEach(employee => {
                if (!uniqueEmployeesSet.has(employee.empId)) {
                    const employementDayMoment = moment(employee.employementDay);
                    const finalDays = differenceInDays - employementDayMoment.diff(_startDate, 'days');

                    if (finalDays > 0) {
                        uniqueEmployeesSet.add({
                            ...employee,
                            totalAmount: employee.perDaySalary * finalDays,
                            condition: 2
                        });
                    }

                }
            });

        // Condition 3
        result
            .filter(employee =>
                employee.employementDay >= startDate && employee.releaseDate && employee.releaseDate != null &&
                employee.releaseDate <= endDate
            )
            .forEach(employee => {
                if (!uniqueEmployeesSet.has(employee.empId)) {
                    const employementDayMoment = moment(employee.employementDay);
                    const joiningDays = differenceInDays - employementDayMoment.diff(_startDate, 'days');
                    const releaseDayMoment = moment(employee.releaseDate);
                    const finalDays = joiningDays - _endDate.diff(releaseDayMoment, 'days');
                    if (finalDays > 0) {
                        uniqueEmployeesSet.add({
                            ...employee,
                            totalAmount: employee.perDaySalary * finalDays,
                            condition: 3
                        });
                    }

                }
            });

        // Condition 4
        result
            .filter(employee =>
                employee.employementDay <= startDate && employee.releaseDate && employee.releaseDate != null &&
                employee.releaseDate <= endDate
            )
            .forEach(employee => {
                if (!uniqueEmployeesSet.has(employee.empId)) {
                    const releaseDayMoment = moment(employee.releaseDate);
                    const finalDays = differenceInDays - _endDate.diff(releaseDayMoment, 'days');
                    if (finalDays > 0) {
                        uniqueEmployeesSet.add({
                            ...employee,
                            totalAmount: employee.perDaySalary * finalDays,
                            condition: 4
                        });
                    }
                  
                }
            });
        console.log("uniqueEmployeesSet", uniqueEmployeesSet);

        const uniqueEmployeesArray = Array.from(uniqueEmployeesSet);
        return uniqueEmployeesArray;
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
        dto: ProfitLossReportDto,
        query = ''
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