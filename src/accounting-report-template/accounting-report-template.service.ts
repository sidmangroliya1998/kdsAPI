import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { CreateAccountingReportTemplateDto } from './dto/create-accounting-report-template.dto';
import { UpdateAccountingReportTemplateDto } from './dto/update-accounting-report-template.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  AccountingReportTemplate,
  AccountingReportTemplateDocument,
} from './schemas/accounting-report-template.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { ReportingGroupDto } from './dto/reporting-group-dto';
import { ReportDto, SimplifiedReportDto } from './dto/report.dto';
import {
  GlVoucher,
  GlVoucherDocument,
} from 'src/accounting/schemas/gl-voucher.schema';
import { GlLineType } from 'src/accounting/enum/en.enum';
import { Aggregate, ReportingGroup } from './schemas/reporting-group.schema';

import {
  GlAccountSet,
  GlAccountSetDocument,
} from 'src/gl-account-set/schemas/gl-account-set.schema';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { OperationType } from './enum/en.enum';
import {
  GlAccount,
  GlAccountDocument,
} from 'src/gl-account/schemas/gl-account.schema';
import { Workbook } from 'exceljs';
import * as tmp from 'tmp';
import * as fs from 'fs';

@Injectable()
export class AccountingReportTemplateService {
  constructor(
    @InjectModel(AccountingReportTemplate.name)
    private readonly accountingReportingTemplateModel: Model<AccountingReportTemplateDocument>,
    @InjectModel(AccountingReportTemplate.name)
    private readonly accountingReportingTemplateModelPag: PaginateModel<AccountingReportTemplateDocument>,
    @InjectModel(GlVoucher.name)
    private readonly glVoucherModel: Model<GlVoucherDocument>,
    @InjectModel(GlAccount.name)
    private readonly glAccountModel: Model<GlAccountDocument>,
    @InjectModel(GlAccountSet.name)
    private readonly glAccountSetModel: Model<GlAccountSetDocument>,
  ) {}

  async create(
    req: any,
    dto: CreateAccountingReportTemplateDto,
  ): Promise<AccountingReportTemplateDocument> {
    dto.reportingGroup.forEach((rg) => {
      rg.indent = 0;
      if (rg.children?.length > 0)
        rg.children = this.processRecursive(rg.children, 1);
    });
    return await this.accountingReportingTemplateModel.create({
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
  ): Promise<PaginateResult<AccountingReportTemplateDocument>> {
    const accountingReportTemplates =
      await this.accountingReportingTemplateModelPag.paginate(
        { supplierId: req.user.supplierId },
        {
          sort: DefaultSort,
          lean: true,
          ...paginateOptions,
          ...pagination,
        },
      );
    return accountingReportTemplates;
  }

  async findOne(
    accountingReportTemplateId: string,
  ): Promise<AccountingReportTemplateDocument> {
    const exists = await this.accountingReportingTemplateModel.findById(
      accountingReportTemplateId,
    );

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async execute(
    req,
    accountingReportTemplateId: string,
    query: ReportDto,
    isFile = false,
  ): Promise<any> {
    const exists: any = await this.accountingReportingTemplateModel
      .findById(accountingReportTemplateId)
      .lean();

    console.log(exists);
    if (!exists) {
      throw new NotFoundException();
    }
    let periodQuery: any = { year: { $in: query.reportingYear } };
    let comparisionPeriodQuery: any = query.comparingYear
      ? { year: { $in: query.comparingYear } }
      : null;
    if (query.reportingPeriodStart && query.reportingPeriodEnd) {
      periodQuery.period = {
        $gte: query.reportingPeriodStart,
        $lte: query.reportingPeriodEnd,
      };
    }
    if (query.comparingPeriodStart && query.comparingPeriodEnd) {
      comparisionPeriodQuery.period = {
        $gte: query.comparingPeriodStart,
        $lte: query.comparingPeriodEnd,
      };
    }
    console.log(periodQuery);
    for (const i in exists.reportingGroup) {
      if (exists.reportingGroup[i].glAccountSetId) {
        const glAccountSet = await this.glAccountSetModel.findById(
          exists.reportingGroup[i].glAccountSetId,
        );

        exists.reportingGroup[i].reportData = await this.fetchReportData(
          req,
          {
            year: query.reportingYear,
            periodStart: query.reportingPeriodStart,
            periodEnd: query.reportingPeriodEnd,
            glAccountIds: glAccountSet?.glAccountIds ?? [],
          },
          periodQuery,
          exists.reportingGroup[i],
        );
        exists.reportingGroup[i].compareData = [];
        if (comparisionPeriodQuery) {
          exists.reportingGroup[i].compareData = await this.fetchReportData(
            req,
            {
              year: query.comparingYear,
              periodStart: query.comparingPeriodStart,
              periodEnd: query.comparingPeriodEnd,
              glAccountIds: glAccountSet?.glAccountIds ?? [],
            },
            comparisionPeriodQuery,
            exists.reportingGroup[i],
          );
        }
      }
      if (exists.reportingGroup[i].aggregate) {
        const reportingGroups: ReportingGroup[] = this.performAggregate(
          exists.reportingGroup[i].aggregate,
          exists,
        );
        console.log(reportingGroups);
        exists.reportingGroup[i].aggregateData = [];
        exists.reportingGroup[i].compareAggregateData = [];
        reportingGroups.forEach((rg) => {
          let counter = 0;
          rg.reportData?.forEach((rd) => {
            let key = 'key_' + counter;
            console.log('Key', key);
            counter++;
            if (!exists.reportingGroup[i].aggregateData[key]) {
              exists.reportingGroup[i].aggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,
                total: null,
              };
            }
            if (
              exists.reportingGroup[i].aggregate.operation == OperationType.Add
            ) {
              if (exists.reportingGroup[i].aggregateData[key].total)
                exists.reportingGroup[i].aggregateData[key].total += rd.total;
              else exists.reportingGroup[i].aggregateData[key].total = rd.total;
            } else if (
              exists.reportingGroup[i].aggregate.operation ==
              OperationType.Substract
            ) {
              if (exists.reportingGroup[i].aggregateData[key].total)
                exists.reportingGroup[i].aggregateData[key].total -= rd.total;
              else exists.reportingGroup[i].aggregateData[key].total = rd.total;
            }
            console.log('Data', exists.reportingGroup[i].aggregateData[key]);
          });
          counter = 0;
          rg.compareData?.forEach((rd) => {
            let key = 'key_' + counter;
            counter++;

            if (!exists.reportingGroup[i].compareAggregateData[key]) {
              exists.reportingGroup[i].compareAggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,

                total: null,
              };
            }
            if (
              exists.reportingGroup[i].aggregate.operation == OperationType.Add
            ) {
              if (exists.reportingGroup[i].compareAggregateData[key].total)
                exists.reportingGroup[i].compareAggregateData[key].total +=
                  rd.total;
              else
                exists.reportingGroup[i].compareAggregateData[key].total =
                  rd.total;
            } else if (
              exists.reportingGroup[i].aggregate.operation ==
              OperationType.Substract
            ) {
              if (exists.reportingGroup[i].compareAggregateData[key].total)
                exists.reportingGroup[i].compareAggregateData[key].total -=
                  rd.total;
              else
                exists.reportingGroup[i].compareAggregateData[key].total =
                  rd.total;
            }
          });

          counter = 0;
          rg.aggregateData?.forEach((rd) => {
            let key = 'key_' + counter;
            console.log('Key', key);
            counter++;
            if (!exists.reportingGroup[i].aggregateData[key]) {
              exists.reportingGroup[i].aggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,
                total: null,
              };
            }
            if (
              exists.reportingGroup[i].aggregate.operation == OperationType.Add
            ) {
              if (exists.reportingGroup[i].aggregateData[key].total)
                exists.reportingGroup[i].aggregateData[key].total += rd.total;
              else exists.reportingGroup[i].aggregateData[key].total = rd.total;
            } else if (
              exists.reportingGroup[i].aggregate.operation ==
              OperationType.Substract
            ) {
              if (exists.reportingGroup[i].aggregateData[key].total)
                exists.reportingGroup[i].aggregateData[key].total -= rd.total;
              else exists.reportingGroup[i].aggregateData[key].total = rd.total;
            }
            console.log('Data', exists.reportingGroup[i].aggregateData[key]);
          });
          counter = 0;
          rg.compareAggregateData?.forEach((rd) => {
            let key = 'key_' + counter;
            counter++;

            if (!exists.reportingGroup[i].compareAggregateData[key]) {
              exists.reportingGroup[i].compareAggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,

                total: null,
              };
            }
            if (
              exists.reportingGroup[i].aggregate.operation == OperationType.Add
            ) {
              if (exists.reportingGroup[i].compareAggregateData[key].total)
                exists.reportingGroup[i].compareAggregateData[key].total +=
                  rd.total;
              else
                exists.reportingGroup[i].compareAggregateData[key].total =
                  rd.total;
            } else if (
              exists.reportingGroup[i].aggregate.operation ==
              OperationType.Substract
            ) {
              if (exists.reportingGroup[i].compareAggregateData[key].total)
                exists.reportingGroup[i].compareAggregateData[key].total -=
                  rd.total;
              else
                exists.reportingGroup[i].compareAggregateData[key].total =
                  rd.total;
            }
          });
        });
        console.log(
          exists.reportingGroup[i].aggregateData,
          exists.reportingGroup[i].compareAggregateData,
        );
        exists.reportingGroup[i].aggregateData = Object.values(
          exists.reportingGroup[i].aggregateData,
        );
        exists.reportingGroup[i].compareAggregateData = Object.values(
          exists.reportingGroup[i].compareAggregateData,
        );
        console.log(
          exists.reportingGroup[i].aggregateData,
          exists.reportingGroup[i].compareAggregateData,
        );
      }
      if (exists.reportingGroup[i].children?.length > 0) {
        exists.reportingGroup[i].children =
          await this.processRecursiveForReportData(
            req,
            exists.reportingGroup[i].children,
            query,

            exists,
          );
      }
    }
    if (isFile) {
      return await this.exportTemplateReport(exists);
    }
    return exists;
  }

  async exportTemplateReport(reportTemplate: AccountingReportTemplateDocument) {
    const book = new Workbook();
    const sheet = book.addWorksheet(reportTemplate.name);
    let records = [];
    reportTemplate.reportingGroup?.forEach((rg) => {
      if (rg.startOfGroup) {
        records.push([rg.startOfGroup]);
      }
      let i = 0;
      rg.reportData?.forEach((rd) => {
        let compareData = [];
        if (rg.compareData?.length > 0) {
          compareData = rg.compareData[i]
            ? [rg.compareData[i].glAccountName, '' + rg.compareData[i].total]
            : [];
        }
        records.push([rd.glAccountName, '' + rd.total, '', ...compareData]);
        i++;
      });
      i = 0;
      rg.aggregateData?.forEach((ad) => {
        let compareData = [];
        if (rg.compareAggregateData?.length > 0) {
          compareData = rg.compareAggregateData[i]
            ? [
                rg.compareAggregateData[i].glAccountName,
                '' + rg.compareAggregateData[i].total,
              ]
            : [];
        }
        records.push([ad.glAccountName, '' + ad.total, '', ...compareData]);
        i++;
      });
      if (rg?.children?.length > 0) {
        records = this.processExportRecursive(rg.children, records);
      }
      if (rg.endOfGroup) {
        records.push([rg.endOfGroup]);
      }
    });
    sheet.addRows(records);
    const tmpFile = tmp.fileSync({
      mode: 0o644,
    });
    await book.xlsx.writeFile(tmpFile.name);
    const file = fs.createReadStream(tmpFile.name);
    return new StreamableFile(file);
  }

  processExportRecursive(children: ReportingGroup[], records: any[]) {
    children?.forEach((rg) => {
      let prefix = '';
      if (rg.indent > 0) {
        for (let i = 0; i < rg.indent; i++) {
          prefix += '  ';
        }
      }

      if (rg.startOfGroup) {
        records.push([prefix + '' + rg.startOfGroup]);
      }
      let i = 0;
      rg.reportData?.forEach((rd) => {
        let compareData = [];
        if (rg.compareData?.length > 0) {
          compareData = rg.compareData[i]
            ? [
                prefix + '' + rg.compareData[i].glAccountName,
                prefix + '' + rg.compareData[i].total,
              ]
            : [];
        }
        records.push([
          prefix + '' + rd.glAccountName,
          prefix + '' + rd.total,
          '',
          ...compareData,
        ]);
        i++;
      });
      i = 0;
      rg.aggregateData?.forEach((ad) => {
        let compareData = [];
        if (rg.compareAggregateData?.length > 0) {
          compareData = rg.compareAggregateData[i]
            ? [
                prefix + '' + rg.compareAggregateData[i].glAccountName,
                prefix + '' + rg.compareAggregateData[i].total,
              ]
            : [];
        }
        records.push([
          prefix + '' + ad.glAccountName,
          prefix + '' + ad.total,
          '',
          ...compareData,
        ]);
        i++;
      });
      if (rg?.children?.length > 0) {
        records = this.processExportRecursive(rg.children, records);
      }
      if (rg.endOfGroup) {
        records.push([prefix + '' + rg.endOfGroup]);
      }

      if (rg?.children?.length > 0) {
        records = records.concat(
          this.processExportRecursive(rg.children, records),
        );
      }
    });
    return records;
  }

  async processRecursiveForReportData(
    req,
    children: ReportingGroup[] | any,
    query: ReportDto,

    reportTemplate: AccountingReportTemplateDocument,
  ) {
    let periodQuery: any = { year: { $in: query.reportingYear } };
    let comparisionPeriodQuery: any = query.comparingYear
      ? { year: { $in: query.comparingYear } }
      : null;
    if (query.reportingPeriodStart && query.reportingPeriodEnd) {
      periodQuery.period = {
        $gte: query.reportingPeriodStart,
        $lte: query.reportingPeriodEnd,
      };
    }
    if (query.comparingPeriodStart && query.comparingPeriodEnd) {
      comparisionPeriodQuery.period = {
        $gte: query.comparingPeriodStart,
        $lte: query.comparingPeriodEnd,
      };
    }
    for (const i in children) {
      if (children[i].glAccountSetId) {
        const glAccountSet = await this.glAccountSetModel.findById(
          children[i].glAccountSetId,
        );

        children[i].reportData = await this.fetchReportData(
          req,
          {
            year: query.reportingYear,
            periodStart: query.reportingPeriodStart,
            periodEnd: query.reportingPeriodEnd,
            glAccountIds: glAccountSet?.glAccountIds ?? [],
          },
          periodQuery,
          children[i],
        );
        children[i].compareData = [];
        if (comparisionPeriodQuery) {
          children[i].compareData = await this.fetchReportData(
            req,
            {
              year: query.comparingYear,
              periodStart: query.comparingPeriodStart,
              periodEnd: query.comparingPeriodEnd,
              glAccountIds: glAccountSet?.glAccountIds ?? [],
            },
            comparisionPeriodQuery,
            children[i],
          );
        }
      }
      if (children[i].aggregate) {
        const reportingGroups: ReportingGroup[] = this.performAggregate(
          children[i].aggregate,
          reportTemplate,
        );

        children[i].aggregateData = [];
        children[i].compareAggregateData = [];
        reportingGroups.forEach((rg) => {
          let counter = 0;
          rg.reportData?.forEach((rd) => {
            console.log(1);

            const key = 'key_' + counter;
            counter++;
            if (!children[i].aggregateData[key]) {
              children[i].aggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,
                total: null,
              };
            }
            if (children[i].aggregate.operation == OperationType.Add) {
              if (children[i].aggregateData[key].total)
                children[i].aggregateData[key].total += rd.total;
              else children[i].aggregateData[key].total = rd.total;
            } else if (
              children[i].aggregate.operation == OperationType.Substract
            ) {
              if (children[i].aggregateData[key].total)
                children[i].aggregateData[key].total -= rd.total;
              else children[i].aggregateData[key].total = rd.total;
            }
          });
          counter = 0;
          rg.compareData?.forEach((rd) => {
            console.log(rd);

            const key = 'key_' + counter;
            counter++;

            if (!children[i].compareAggregateData[key]) {
              children[i].compareAggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,
                total: null,
              };
            }
            if (children[i].aggregate.operation == OperationType.Add) {
              if (children[i].compareAggregateData[key].total)
                children[i].compareAggregateData[key].total += rd.total;
              else children[i].compareAggregateData[key].total = rd.total;
            } else if (
              children[i].aggregate.operation == OperationType.Substract
            ) {
              if (children[i].compareAggregateData[key].total)
                children[i].compareAggregateData[key].total -= rd.total;
              else children[i].compareAggregateData[key].total = rd.total;
            }
          });

          counter = 0;
          rg.aggregateData?.forEach((rd) => {
            console.log(1);

            const key = 'key_' + counter;
            counter++;
            if (!children[i].aggregateData[key]) {
              children[i].aggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,
                total: null,
              };
            }
            if (children[i].aggregate.operation == OperationType.Add) {
              if (children[i].aggregateData[key].total)
                children[i].aggregateData[key].total += rd.total;
              else children[i].aggregateData[key].total = rd.total;
            } else if (
              children[i].aggregate.operation == OperationType.Substract
            ) {
              if (children[i].aggregateData[key].total)
                children[i].aggregateData[key].total -= rd.total;
              else children[i].aggregateData[key].total = rd.total;
            }
          });
          counter = 0;
          rg.compareAggregateData?.forEach((rd) => {
            console.log(rd);

            const key = 'key_' + counter;
            counter++;

            if (!children[i].compareAggregateData[key]) {
              children[i].compareAggregateData[key] = {
                _id: rd._id,
                glAccountName: rd.glAccountName,
                glAccountNameAr: rd.glAccountNameAr,
                glAccountNumber: rd.glAccountNumber,
                total: null,
              };
            }
            if (children[i].aggregate.operation == OperationType.Add) {
              if (children[i].compareAggregateData[key].total)
                children[i].compareAggregateData[key].total += rd.total;
              else children[i].compareAggregateData[key].total = rd.total;
            } else if (
              children[i].aggregate.operation == OperationType.Substract
            ) {
              if (children[i].compareAggregateData[key].total)
                children[i].compareAggregateData[key].total -= rd.total;
              else children[i].compareAggregateData[key].total = rd.total;
            }
          });
        });
        children[i].aggregateData = Object.values(children[i].aggregateData);
        children[i].compareAggregateData = Object.values(
          children[i].compareAggregateData,
        );
      }
      if (children[i]?.children?.length > 0) {
        children[i].children = await this.processRecursiveForReportData(
          req,
          children[i].children,
          query,

          reportTemplate,
        );
      }
    }

    return children;
  }

  async fetchReportData(
    req,
    query: SimplifiedReportDto,
    periodQuery,
    reportingGroup: ReportingGroup,
  ) {
    // let groupParam: any = { year: '$y', month: '$m' };
    // if (query.year.length > 1) groupParam = { year: '$y' };
    const glAccountVouchers = await this.glVoucherModel.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
          ...periodQuery,
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
          y: { $year: { date: '$createdAt' } },
          m: { $month: { date: '$createdAt' } },
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
      if (reportingGroup.negativeNature) {
        total = total * -1;
      }
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

  performAggregate(
    aggregate: Aggregate,
    reportTemplate: AccountingReportTemplateDocument,
  ) {
    let elements = [];

    reportTemplate.reportingGroup.forEach((rg) => {
      if (aggregate.groupOrders.includes(rg.order)) elements.push(rg);
      if (rg.children?.length > 0) {
        const tempElements = this.processAggregateRecursive(
          aggregate,
          rg.children,
        );
        elements = elements.concat(tempElements);
      }
    });

    return elements;
  }

  processAggregateRecursive(obj, children: ReportingGroup[]) {
    let tempElements = [];
    children.forEach((c) => {
      if (obj.groupOrders.includes(c.order)) {
        tempElements.push(c);
      }
      if (c.children?.length > 0) {
        tempElements = tempElements.concat(
          this.processAggregateRecursive(obj, c.children),
        );
      }
    });
    return tempElements;
  }

  async update(
    accountingReportTemplateId: string,
    dto: UpdateAccountingReportTemplateDto,
  ): Promise<AccountingReportTemplateDocument> {
    const accountingReportTemplate =
      await this.accountingReportingTemplateModel.findByIdAndUpdate(
        accountingReportTemplateId,
        dto,
        {
          new: true,
        },
      );

    if (!accountingReportTemplate) {
      throw new NotFoundException();
    }

    return accountingReportTemplate;
  }

  async remove(accountingReportTemplateId: string): Promise<boolean> {
    const accountingReportTemplate =
      await this.accountingReportingTemplateModel.findByIdAndRemove(
        accountingReportTemplateId,
      );

    if (!accountingReportTemplate) {
      throw new NotFoundException();
    }
    return true;
  }
}
