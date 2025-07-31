// src/task-management/task.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { LeanDocument, Model, PaginateModel, PaginateResult } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskManagement, TaskManagementDocument } from './schema/task-mgmt.schema';
import { DefaultSort, PaginationDto, pagination } from 'src/core/Constants/pagination';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateBulkApprovalDto, CreateBulkTaskDto } from './dto/create-bulk-task.dto';
import { BulkTaskType, TaskStatus } from './enum/en';
import { Expense, ExpenseDocument } from 'src/expense/schemas/expense.schema';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { Purchase, PurchaseDocument } from 'src/purchase/schemas/purchase.schema';
import { TransStatus } from 'src/core/Constants/enum';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { PurchaseService } from 'src/purchase/purchase.service';
import { ExpenseService } from 'src/expense/expense.service';

@Injectable()
export class TaskManagementService {
    constructor(
        @InjectModel(TaskManagement.name)
        private readonly taskModel: Model<TaskManagementDocument>,

        @InjectModel(TaskManagement.name)
        private readonly taskModelPag: PaginateModel<TaskManagementDocument>,

        @InjectModel(Expense.name)
        private readonly expenseModel: Model<ExpenseDocument>,

        @InjectModel(Purchase.name)
        private readonly purchaseModel: Model<PurchaseDocument>,

        @InjectModel(PurchaseOrder.name)
        private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,

        private readonly purchaseOrderService: PurchaseOrderService,
        private readonly purchaseService: PurchaseService,
        private readonly expenseService: ExpenseService,
    ) { }

    async create(req: any, dto: CreateTaskDto): Promise<TaskManagementDocument> {

        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.taskModel.findOne(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
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
        );
        if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber != '') {
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('TS-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'TS-' + postFix + String(counter).padStart(5, '0');
        return await this.taskModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            docNumber: _docNumber
        });
    }

    async createBulk(req: any, dto: CreateBulkTaskDto) {
        let data = []
        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.taskModel.findOne(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('TS-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        for (let i = 0; i < dto.fileURLs.length; i++) {
            const el = dto.fileURLs[i];
            const _docNumber = 'TS-' + postFix + String(counter).padStart(5, '0');
            data.push({
                supplierId: req.user.supplierId,
                restaurantId: dto.restaurantId,
                fileURL: el,
                docNumber: _docNumber
            });
            counter++;
        }

        await this.taskModel.insertMany(data);
        return true;
    }

    async findAll(req: any,
        paginateOptions: PaginationDto
    ): Promise<any> {
        let query: any = {};
        if (req.query.restaurantId) {
            query.restaurantId = new mongoose.Types.ObjectId(req.query.restaurantId);
        }

        if (req.query.isPendingOnly && req.query.isPendingOnly?.toString() == 'true') {
            query.taskStatus = TaskStatus.Pending;
        }
        if (req.query.startDate && req.query.endDate) {
            let startDate = new Date(req.query.startDate);
            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);

            let endDate = new Date(req.query.endDate);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);

            query.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        }
        if (req.query.postedStartDate && req.query.postedEndDate) {
            let startDate = new Date(req.query.postedStartDate);
            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);

            let endDate = new Date(req.query.postedEndDate);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);

            query.docPostedDate = {
                $gte: startDate,
                $lte: endDate,
            };
        }

        if (req.query.searchText && req.query.searchText != '') {

            query.$or = [
                {
                    referenceDocNumber: { $regex: req.query.searchText, $options: 'i' }
                },
                {
                    docNumber: { $regex: req.query.searchText, $options: 'i' }
                },
                {
                    docReferenceNumber: { $regex: req.query.searchText, $options: 'i' }
                }
            ];
        }
        if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
            const amountRangeQuery: any = {};

            if (req.query.minAmount > 0) {
                amountRangeQuery.$gte = Number(req.query.minAmount);
            }
            if (req.query.maxAmount > 0) {
                amountRangeQuery.$lte = Number(req.query.maxAmount);
            }
            query.totalAmount = amountRangeQuery;
        }

        const taskMgmt = await this.taskModelPag.paginate(
            {
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                ...query
            },
            {
                sort: paginateOptions.sortBy
                    ? {
                        [paginateOptions.sortBy]: paginateOptions.sortDirection
                            ? paginateOptions.sortDirection
                            : -1,
                    }
                    : DefaultSort,
                lean: true,
                ...paginateOptions,
                ...pagination,
                populate: [{
                    path: 'docObject.items.materialId',
                    model: 'Material'
                }]
            });

        const aggregateResult = await this.taskModel.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                    ...query
                }
            },
            {
                $group: {
                    _id: '$taskType', // Group by taskType
                    totalAmount: { $sum: '$totalAmount' }, // Calculate sum of totalAmount for each group
                    totalTax: { $sum: '$totalTax' }, // Calculate sum of totalTax for each group
                    totalNet: { $sum: '$totalNet' }, // Calculate sum of totalNet for each group
                }
            }
        ]);

        taskMgmt.summary = aggregateResult;

        return taskMgmt;
    }

    async findById(id: string): Promise<TaskManagementDocument> {
        return this.taskModel.findById(id);
    }

    async update(req: any, id: string, updateTaskDto: UpdateTaskDto): Promise<TaskManagementDocument> {

        if (updateTaskDto.docObject && updateTaskDto.docObject?.referenceNumber != '') {

            let checkExistsRef = null;
            checkExistsRef = await this.taskModel.findOne({
                supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                taskType: updateTaskDto.taskType,
                docReferenceNumber: updateTaskDto.docObject?.referenceNumber,
                referenceDocId: { $ne: null },
            });
            console.log("checkExistsRef", checkExistsRef)

            if (!checkExistsRef || checkExistsRef == null) {
                if (updateTaskDto.taskType == BulkTaskType.PO) {
                    checkExistsRef = await this.purchaseOrderModel.findOne({
                        supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                        referenceNumber: updateTaskDto.docObject?.referenceNumber
                    });
                    console.log("checkExistsRef2", checkExistsRef)
                }
                else if (updateTaskDto.taskType == BulkTaskType.Purchase) {
                    checkExistsRef = await this.purchaseModel.findOne({
                        supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                        referenceNumber: updateTaskDto.docObject?.referenceNumber
                    });
                }
                else if (updateTaskDto.taskType == BulkTaskType.Expense) {
                    checkExistsRef = await this.expenseModel.findOne({
                        supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
                        referenceNumber: updateTaskDto.docObject?.referenceNumber
                    });
                }
            }



            if (checkExistsRef && checkExistsRef != null) {
                throw new BadRequestException('Reference number already exists');
            }
        }

        if (updateTaskDto.docObject && updateTaskDto.docObject.date) {

            console.log("updateTaskDto.docObject", updateTaskDto.docObject);
            return this.taskModel.findByIdAndUpdate(id,
                {
                    ...updateTaskDto,
                    docPostedDate: updateTaskDto.docObject.date,
                    docReferenceNumber: updateTaskDto.docObject?.referenceNumber
                }, { new: true });
        }
        else {
            return this.taskModel.findByIdAndUpdate(id,
                {
                    ...updateTaskDto
                }, { new: true });
        }

    }

    async bulkApproval(req: any, dto: CreateBulkApprovalDto) {

        this.approvePOPurchaseExpense(req, dto);
        return await this.taskModel.updateMany(
            { _id: { $in: dto.taskIds.map(id => new mongoose.Types.ObjectId(id)) } },
            {
                $set: {
                    taskStatus: TaskStatus.Approved,
                    approvedDate: new Date()
                }
            }
        );
    }

    async approvePOPurchaseExpense(req: any, dto: CreateBulkApprovalDto) {

        const allTasks = await this.taskModel.find({
            _id: { $in: dto.taskIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        if (allTasks && allTasks?.length > 0) {
            for (let i = 0; i < allTasks.length; i++) {

                const el = allTasks[i];
                req = {
                    user: {
                        supplierId: el.supplierId
                    }
                }
                if (el.taskType == BulkTaskType.PO && el.docObject) {
                    const poData = el.docObject;
                    poData.transType = TransStatus.Approved;
                    const po = await this.purchaseOrderService.create(req, poData, null);
                    if (po && po != null) {
                        await this.taskModel.findByIdAndUpdate(el._id,
                            {
                                referenceDocId: po._id,
                                referenceDocNumber: po.poNumber,
                                docPostedDate: po.date,
                                docReferenceNumber: po.referenceNumber
                            }, { new: true });
                    }

                }
                else if (el.taskType == BulkTaskType.Purchase && el.docObject) {
                    const pp = el.docObject;
                    pp.transType = TransStatus.Approved;
                    const purchase = await this.purchaseService.create(req, pp);
                    if (purchase) {
                        await this.taskModel.findByIdAndUpdate(el._id,
                            {
                                referenceDocId: purchase._id,
                                referenceDocNumber: purchase.voucherNumber,
                                docPostedDate: purchase.date,
                                docReferenceNumber: purchase.referenceNumber
                            }, { new: true });
                    }

                }
                else if (el.taskType == BulkTaskType.Expense && el.docObject) {
                    const exp = el.docObject;
                    exp.transType = TransStatus.Approved;
                    const expense = await this.expenseService.create(req, el.docObject);
                    if (expense) {
                        await this.taskModel.findByIdAndUpdate(el._id,
                            {
                                referenceDocId: expense._id,
                                referenceDocNumber: expense.voucherNumber,
                                docPostedDate: expense.date,
                                docReferenceNumber: expense.referenceNumber
                            }, { new: true });
                    }

                }
            }
        }

    }

    async delete(id: string): Promise<TaskManagementDocument> {
        return this.taskModel.findByIdAndRemove(id);
    }

    async bulkProcess() {

        // //update all date
        // const allTasks = await this.taskModel.find({
        //     referenceDocId: { $ne: null },
        //     $or: [
        //         { docPostedDate: { $exists: false } },
        //         { docPostedDate: null }
        //     ],
        //     docObject: { $exists: true }
        // });

        // for (let i = 0; i < allTasks.length; i++) {
        //     const el = allTasks[i];
        //     await this.taskModel.findByIdAndUpdate(el._id, {
        //         docPostedDate: el.docObject.date
        //     }, { new: true });
        // }

        //update all referenceNumber & voucherNumber

        // const allTaskData = await this.taskModel.find({
        //     referenceDocId: { $ne: null },
        // })
        // for (let i = 0; i < allTaskData.length; i++) {
        //     const el = allTaskData[i];
        //     let refNumber = "", voucherNumber = "", postedDate = null;
        //     if (el.taskType?.toString() == "PO" || el.taskType?.toString() == "Purchase Order") {
        //         const poData = await this.purchaseOrderModel.findById(el.referenceDocId);
        //         if (poData) {
        //             refNumber = poData.referenceNumber?.toString();
        //             voucherNumber = poData.poNumber?.toString();
        //             postedDate = poData.date;
        //         }
        //     }
        //     else if (el.taskType == BulkTaskType.Purchase) {
        //         const purchaseData = await this.purchaseModel.findById(el.referenceDocId);
        //         if (purchaseData) {
        //             refNumber = purchaseData.referenceNumber?.toString();
        //             voucherNumber = purchaseData.voucherNumber?.toString();
        //             postedDate = purchaseData.date;
        //         }
        //     }
        //     else if (el.taskType == BulkTaskType.Expense) {
        //         const expenseData = await this.expenseModel.findById(el.referenceDocId);
        //         if (expenseData) {
        //             refNumber = expenseData.referenceNumber?.toString();
        //             voucherNumber = expenseData.voucherNumber?.toString();
        //             postedDate = expenseData.date;
        //         }
        //     }
        //     if (refNumber != '' || postedDate != '' || voucherNumber != '') {
        //         await this.taskModel.findByIdAndUpdate(el._id, {
        //             docPostedDate: postedDate,
        //             referenceDocNumber: voucherNumber,
        //             docReferenceNumber: refNumber
        //         }, { new: true });
        //     }


        // }

        const taskAlreadyApproved = await this.taskModel.find({
            $or: [
                { referenceDocId: { $exists: false } },
                { referenceDocId: null },
                { referenceDocId: "" }
            ],
            taskStatus: TaskStatus.Approved
        });

        // for (let i = 0; i < taskAlreadyApproved.length; i++) {
        //     const el = taskAlreadyApproved[i];
        //     await this.taskModel.findByIdAndUpdate(el._id, {
        //         docPostedDate: el.docObject?.date,
        //         docReferenceNumber: el.docObject?.referenceNumber?.toString()
        //     }, { new: true });
        // }

        const allTasksIds = taskAlreadyApproved.map((m: any) => m._id);
        //console.log("taskAlreadyApproved", allTasksIds?.toString());

        const ids: CreateBulkApprovalDto = {
            taskIds: allTasksIds
        }
        await this.approvePOPurchaseExpense(null, ids);


        return true;
    }
}
