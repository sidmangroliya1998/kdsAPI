import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { CreateEmpDto } from '../dto/create-emp.dto';
import { Emp, EmpDocument } from '../schemas/emp.schema';
import { UpdateEmpDto } from '../dto/update-emp-dto';
import { SequenceService } from 'src/sequence/sequence.service';
import { ObjectType } from 'src/sequence/enum/en';
import { EmpMeal, EmpMealDocument } from '../schemas/emp-meal-schema';
import { CreateEmpMealDto } from '../dto/create-emp-meal.dto';
import { TransStatus } from 'src/core/Constants/enum';
import { OrderService } from 'src/order/order.service';
import { CreateOrderDto } from 'src/order/dto/create-order.dto';
import { OrderPaymentStatus, OrderStatus, OrderType } from 'src/order/enum/en.enum';
import { UpdateEmpMealDto } from '../dto/update-emp-meal.dto';
import { OrderHelperService } from 'src/order/order-helper.service';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import mongoose from 'mongoose';

@Injectable()
export class EmpService {
    constructor(
        @InjectModel(Emp.name)
        private readonly empModel: Model<EmpDocument>,
        @InjectModel(Emp.name)
        private readonly empModelPag: PaginateModel<EmpDocument>,
        @InjectModel(EmpMeal.name)
        private readonly empMealModel: Model<EmpMealDocument>,
        @InjectModel(EmpMeal.name)
        private readonly empMealModelPag: PaginateModel<EmpMealDocument>,
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        private sequenceService: SequenceService,
        private orderService: OrderService,
        private readonly glVoucherHelperService: GlVoucherHelperService,
    ) { }

    async create(
        req: any,
        dto: CreateEmpDto,
    ): Promise<EmpDocument> {
        // const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.empModel.findOne(
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
        if (_lastDocNo && _lastDocNo.empCode && _lastDocNo.empCode != '') {
            _lastDocNo.empCode = _lastDocNo.empCode.replace('EMP-', '');
            const arr = _lastDocNo.empCode.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'EMP-' + String(counter).padStart(5, '0');

        const sequence = await this.sequenceService.createAndUpdate(ObjectType.Employee, req.user.supplierId, 'e')
        return await this.empModel.create({
            ...dto,
            empCode: _docNumber,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
            sequenceNumber: sequence.sequenceValue
        });
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpDocument>> {
        const emps = await this.empModelPag.paginate(
            { supplierId: req.user.supplierId },
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
                ]
            },
        );
        return emps;
    }

    async findOne(empId: string): Promise<EmpDocument> {
        const exists = await this.empModel.findById(empId);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        empId: string,
        dto: UpdateEmpDto,
    ): Promise<EmpDocument> {
        const emp = await this.empModel.findByIdAndUpdate(
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
        const emp = await this.empModel.findByIdAndRemove(
            empId,
        );

        if (!emp) {
            throw new NotFoundException();
        }
        return true;
    }

    async createEmployeeMeal(req: any, dto: CreateEmpMealDto) {

        let counter = 1;
        let _lastDocNo = await this.empMealModel.findOne(
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
        );
        if (_lastDocNo && _lastDocNo.docNumber && _lastDocNo.docNumber !== '') {
            const arr = _lastDocNo.docNumber.replace('EMV', '').split('-');
            if (arr.length > 1) {
                const parsedCounter = parseInt(arr[1], 10);
                if (!isNaN(parsedCounter)) {
                    counter = parsedCounter + 1;
                }
            }
        }
        const _docNumber = 'EMV-' + String(counter).padStart(5, '0');

        let empmealResp = await this.empMealModel.create({
            empId: dto.empId,
            restaurantId: dto.restaurantId,
            referenceNumber: dto.referenceNumber,
            notes: dto.notes,
            items: dto.items,
            transType: dto.transType,
            docNumber: _docNumber,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,

        });

        if (empmealResp && dto.transType == TransStatus.Approved) {
            await this.approveEmployeeMeal(req, empmealResp._id);
        }

        return empmealResp;
    }

    async findAllEmployeeMeal(req: any,
        paginateOptions: PaginationDto) {
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

        if (req.query && req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);

            queryToApply.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
            delete queryToApply.startDate;
            delete queryToApply.endDate;
        }
        if (req.query.createdByIds) {
            queryToApply.addedBy = {
                $in: req.query.createdByIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
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

        if (req.query && req.query.notes && req.query.notes != '') {
            const refQuery = {
                $expr: {
                    $regexMatch: {
                        input: { $toString: "$notes" },
                        regex: req.query.notes,
                        options: "i",
                    }
                }
            };
            queryToApply = { ...queryToApply, ...refQuery };
        }
        if (req.query.employeeIds) {
            queryToApply.empId = {
                $in: req.query.employeeIds.split(',').map(id => new mongoose.Types.ObjectId(id)),
            };
        }
        const emps = await this.empMealModelPag.paginate(
            {
                supplierId: req.user.supplierId,
                ...queryToApply
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
                            _id: 1,
                        },
                    },
                    {
                        path: 'orderId',
                        select: {
                            _id: 1,
                            orderNumber: 1,
                            items: 1,
                            summary: 1
                        }
                    },
                    {
                        path: 'empId',
                        select: {
                            _id: 1,
                            empCode: 1,
                            name: 1,
                            address: 1,
                            payPlan: 1,
                            phone: 1,
                            sequenceNumber: 1
                        }
                    }
                ]
            },
        );
        return emps;
    }

    async updateEmployeeMeal(empMealId: string, dto: UpdateEmpMealDto) {
        const emp = await this.empMealModel.findByIdAndUpdate(
            empMealId,
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

    async findOneEmployeeMeal(empMealId: string) {
        const exists = await this.empMealModel.findById(empMealId).populate([
            {
                path: 'addedBy',
                select: {
                    name: 1,
                    _id: 1,
                },
            },
            {
                path: 'orderId',
                select: {
                    _id: 1,
                    orderNumber: 1,
                    items: 1,
                    summary: 1
                }
            },
            {
                path: 'empId',
                select: {
                    _id: 1,
                    empCode: 1,
                    name: 1,
                    address: 1,
                    payPlan: 1,
                    phone: 1,
                    sequenceNumber: 1
                }
            }
        ]);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async approveEmployeeMeal(req, empMealId: string) {

        let dto = await this.empMealModel.findById(empMealId);


        if (!dto) {
            throw new NotFoundException();
        }

        let orderDto: any = {
            bundles: [],
            customerId: null,
            deliveryAddress: {},
            items: dto.items,
            orderType: OrderType.ToGo,
            restaurantId: dto.restaurantId,
            source: "App",
            isEmployeeMeal: true
        }

        const orderData = await this.orderService.create(req, orderDto, false);

        await this.glVoucherHelperService.handleSale(orderData);

        await this.orderService.generalUpdate(req, orderData._id, { paymentStatus: OrderPaymentStatus.Paid, status: OrderStatus.SentToKitchen });


        dto.orderId = orderData._id;
        dto.transType = TransStatus.Approved;
        await dto.save();
    }


}
