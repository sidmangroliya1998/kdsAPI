import { PrimeCostTemplate, PrimeCostTemplateDocument } from "./schema/prime-cost-template.schema";
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { CreatePrimeCostTemplateDto } from "./dto/create-prime-cost-template.dto";
import { UpdatePrimeCostTemplateDto } from "./dto/update-prime-cost-template.dto";
import { GlVoucher, GlVoucherDocument } from "src/accounting/schemas/gl-voucher.schema";
import { PrimeCostReportDto } from "./dto/prime-cost-report.dto";
import { GlLineType, GlVoucherType } from "src/accounting/enum/en.enum";
import * as moment from 'moment';
import { GlAccountMapping, GlAccountMappingDocument, GlMappingDetail } from "src/gl-account-mapping/schemas/gl-account-mapping.schema";
import { EmpTimeSheet, EmpTimeSheetDocument } from "src/employee-mgmt/schemas/emp-hourly-timesheet.schema";
import { Emp, EmpDocument } from "src/employee-mgmt/schemas/emp.schema";
import { EmployeePayPlan } from "src/employee-mgmt/enum/en";

@Injectable()
export class PrimeCostService {
    constructor(
        @InjectModel(PrimeCostTemplate.name)
        private readonly primeCostTemplateModel: Model<PrimeCostTemplateDocument>,
        @InjectModel(GlVoucher.name)
        private readonly glVoucherModel: Model<GlVoucherDocument>,

        @InjectModel(GlAccountMapping.name)
        private readonly glAccountMappingModel: Model<GlAccountMappingDocument>,

        @InjectModel(EmpTimeSheet.name)
        private readonly emphourlyModel: Model<EmpTimeSheetDocument>,
        @InjectModel(Emp.name)
        private readonly empModel: Model<EmpDocument>,

    ) { }

    async defaultTemplate(req: any): Promise<any> {

        const dto: CreatePrimeCostTemplateDto = {
            "name": "Prime Cost Template",
            "nameAr": "قالب التكلفة الرئيسية",
            "salesGroup": [
                {
                    "name": "Food & Soft Beverage",
                    "nameAr": "الطعام والمشروبات",
                    "indent": 0,
                    "glAccountIds": [],
                    "children": [],
                    "code": "FOOD"
                },
                {
                    "name": "Merchandise & Other",
                    "nameAr": "البضائع والأخرى",
                    "indent": 0,
                    "glAccountIds": [],
                    "children": [],
                    "code": "MERCHANDISE"
                }
            ],
            "cogsGroup": [
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
            "laborGroup": [
                {
                    "name": "Monthly",
                    "nameAr": "الشهري",
                    "indent": 0,
                    "glAccountIds": [],
                    "salesGroupId": null,
                    "children": []
                },
                {
                    "name": "Hourly Personnel",
                    "nameAr": "فريق العمل بالساعة",
                    "indent": 0,
                    "glAccountIds": [],
                    "salesGroupId": null,
                    "children": []
                }
            ]
        }
        const exists = await this.primeCostTemplateModel.find({
            supplierId: req.user.supplierId,
        });
        if (!exists || exists?.length == 0) {
            return this.createTemplate(req, dto);
        }
        return exists;
    }

    async createTemplate(
        req: any,
        dto: CreatePrimeCostTemplateDto,
    ): Promise<PrimeCostTemplateDocument> {
        return await this.primeCostTemplateModel.create(
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
        const templateData = await this.primeCostTemplateModel.find(
            {
                supplierId: req.user.supplierId,
            }
        );
        return templateData;
    }

    async findOneTemplate(templateId: string): Promise<PrimeCostTemplateDocument> {
        const exists = await this.primeCostTemplateModel.findById(templateId);
        if (!exists) {
            throw new NotFoundException();
        }
        return exists;
    }

    async updateTemplate(
        templateId: string,
        dto: UpdatePrimeCostTemplateDto,
    ): Promise<PrimeCostTemplateDocument> {
        const templateData = await this.primeCostTemplateModel.findByIdAndUpdate(
            templateId,
            dto
        );

        if (!templateData) {
            throw new NotFoundException();
        }
        return templateData;
    }

    async removeTemplate(templateId: string): Promise<boolean> {
        const paymentSetup = await this.primeCostTemplateModel.findByIdAndRemove(
            templateId,
        );
        if (!paymentSetup) {
            throw new NotFoundException();
        }
        return true;
    }

    async createReportFromTemplate(req,
        dto: PrimeCostReportDto): Promise<any> {

        const templateData = await this.primeCostTemplateModel.find(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            }
        );
        const response: any = [];
        const glDataByAccount = await this.fetchReportData(req, dto);

        const salesGroupResp = await this.getSalesGroupData(templateData, dto, glDataByAccount);
        const totalAmount = salesGroupResp.find((f: any) => f.id == 'totalSales')?.['total'];
        const getCOGSGroupResp = await this.getCOGSGroupData(templateData[0]['cogsGroup'], dto, glDataByAccount, salesGroupResp, Number(totalAmount));


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
        console.log("getAllSummariesData", getAllSummariesData);
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
                name: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Monthly'))?.name,
                nameAr: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Monthly'))?.nameAr,
                salesGroupId: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Monthly'))?.salesGroupId,
                datewiseData: [],
                total: monthlySalaryAmount,
                percentage: monthlySalaryAmount / totalAmount
            },
            {
                name: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Hourly'))?.name,
                nameAr: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Hourly'))?.nameAr,
                salesGroupId: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Hourly'))?.salesGroupId,
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

        const grossMargin = [{
            name: 'APPROX GROSS MARGIN',
            nameAr: 'نسبة الربح الافتراضية',
            salesGroupId: null,
            datewiseData: [],
            total: totalAmount - primeCostValue,
            percentage: (totalAmount - primeCostValue) / totalAmount
        }];


        response.push({
            salesGroup: salesGroupResp,
            cogsGroup: cogsReport,
            laborGroup: laborGroup,
            primeCost: primeCost,
            grossMargin: grossMargin
        });
        return response;
    }

    async createTrendAnalysisReportFromTemplate(req,
        dto: PrimeCostReportDto): Promise<any> {

        const templateData = await this.primeCostTemplateModel.find(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            }
        );
        const response: any = [];
        const glDataByAccount = await this.fetchReportData(req, dto);

        const startMoment = moment(dto.startDate);
        const endMoment = moment(dto.endDate);

        const weekStartDateList: string[] = [];
        const weekEndDateList: string[] = [];

        // Define the duration for each week (7 days)
        const weekDuration = 7;

        for (let currentMoment = startMoment.clone(); currentMoment.isSameOrBefore(endMoment); currentMoment.add(weekDuration, 'days')) {
            const weekStart = currentMoment.format('YYYY-MM-DD');
            const weekEnd = currentMoment.clone().add(weekDuration - 1, 'days').format('YYYY-MM-DD');
            weekStartDateList.push(weekStart);
            weekEndDateList.push(weekEnd);
        }

        // Print the results
        for (let i = 0; i < weekStartDateList.length; i++) {
           // console.log(`Week ${i + 1}: ${weekStartDateList[i]} to ${weekEndDateList[i]}`);

            const newDTO = {
                startDate: weekStartDateList[i],
                endDate: weekEndDateList[i]
            }
            const salesGroupResp = await this.getSalesGroupData(templateData, newDTO, glDataByAccount);
            const totalAmount = salesGroupResp.find((f: any) => f.id == 'totalSales')?.['total'];
            const getCOGSGroupResp = await this.getCOGSGroupData(templateData[0]['cogsGroup'], newDTO, glDataByAccount, salesGroupResp, Number(totalAmount));


            let cogsReport = [];
            for (let i = 0; i < getCOGSGroupResp.length; i++) {
                const elx = getCOGSGroupResp[i];
                elx.datewiseData = [];
                cogsReport.push(elx);
                if (elx.children && elx.children?.length > 0) {
                    elx.children = elx.children.map(s => {
                        s.datewiseData = [];
                        return s;
                    })
                    cogsReport.push(
                        {
                            id: 'total' + elx.name,
                            name: 'Total ' + elx.name,
                            nameAr: 'اجمالي' + elx.nameAr,
                            datewiseData: [],
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
                datewiseData: [],
                total: getAllSummariesData.reduce((sum, summary) => sum + Number(summary.total), 0),
                children: [],
                indent: 0,
                salesgroupId: null,
                isSummary: true,
                percentage: getAllSummariesData.reduce((sum, summary) => sum + Number(summary.percentage), 0)
            };
            cogsReport.push(finalSummary);

            const hourlySalary = await this.getHourlySalary(req, newDTO);
            const monthlySalary: any = await this.getEmployeeMonthlySalary(req, newDTO);
            const monthlySalaryAmount = monthlySalary.reduce((sum, employee) => sum + employee.totalAmount, 0);

            const laborGroup = [
                {
                    name: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Monthly'))?.name,
                    nameAr: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Monthly'))?.nameAr,
                    salesGroupId: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Monthly'))?.salesGroupId,
                    datewiseData: [],
                    total: monthlySalaryAmount,
                    percentage: monthlySalaryAmount / totalAmount
                },
                {
                    name: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Hourly'))?.name,
                    nameAr: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Hourly'))?.nameAr,
                    salesGroupId: templateData[0]['laborGroup'].find((f: any) => f.name.includes('Hourly'))?.salesGroupId,
                    datewiseData: [],
                    total: hourlySalary.reduce((sum, entry) => sum + entry.totalAmount, 0),
                    percentage: (hourlySalary.reduce((sum, entry) => sum + entry.totalAmount, 0)) / totalAmount
                },
                {
                    name: 'Total',
                    nameAr: 'الاجمالي',
                    salesGroupId: null,
                    datewiseData: [],
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

            const grossMargin = [{
                name: 'APPROX GROSS MARGIN',
                nameAr: 'نسبة الربح الافتراضية',
                salesGroupId: null,
                datewiseData: [],
                total: totalAmount - primeCostValue,
                percentage: (totalAmount - primeCostValue) / totalAmount
            }];


            response.push({
                weekStartDate: weekStartDateList[i],
                weekEndDate: weekEndDateList[i],
                salesGroup: salesGroupResp.map(s => {
                    s.datewiseData = [];
                    return s;
                }),
                cogsGroup: cogsReport,
                laborGroup: laborGroup,
                primeCost: primeCost,
                grossMargin: grossMargin
            });
        }



        return response;
    }

    async getSalesGroupData(templateData, dto, glDataByAccount) {
        const salesGroupData = await Promise.all(
            templateData[0]['salesGroup'].map(async (el: any) => {
                const glAccountIds = el.glAccountIds;
                const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds);
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

    async getCOGSGroupData(cogsGroup, dto, glDataByAccount, salesGroupResp, totalAmount) {
        const calculateNestedGroupData = async (group) => {
            const nestedGroupData = await Promise.all(
                group.map(async (el) => {
                    const glAccountIds = el.glAccountIds || [];
                    const datewiseData = await this.aggregateAndSumByDate(dto.startDate, dto.endDate, glDataByAccount, glAccountIds);
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
        dto.startDate = new Date(dto.startDate);
        dto.endDate = new Date(dto.endDate);
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
                    if (differenceInDays > 0) {
                        uniqueEmployeesSet.add({
                            ...employee,
                            totalAmount: employee.perDaySalary * differenceInDays,
                            condition: 1
                        })
                    }

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

        const uniqueEmployeesArray = Array.from(uniqueEmployeesSet);
        return uniqueEmployeesArray;
    }

    async aggregateAndSumByDate(startDate, endDate, glData, glAccountIds) {
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

        return datewiseData;
    }

    async fetchReportData(
        req,
        dto: PrimeCostReportDto,
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
}