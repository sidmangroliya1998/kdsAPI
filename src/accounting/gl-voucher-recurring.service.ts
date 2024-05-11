import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { GlVoucherRecurring, GlVoucherRecurringDocument } from './schemas/gl-voucher-recurring.schema';
import { CreateGlVoucherRecurringDto } from './dto/create-gl-voucher-recurring.dto';
import { DefaultSort, PaginationDto, pagination } from 'src/core/Constants/pagination';
import { UpdateGlVoucherRecurringDto } from './dto/update-gl-voucher-recurring.dto';
import { GlVoucherService } from './gl-voucher.service';
import { GLTransStatus, GlVoucherType, IntervalType } from './enum/en.enum';
import { Cron } from '@nestjs/schedule';
import { User, UserDocument } from 'src/users/schemas/users.schema';
@Injectable()
export class GlVoucherRecurringService {

    constructor(
        @InjectModel(GlVoucherRecurring.name)
        private readonly glVoucherRecurring: Model<GlVoucherRecurringDocument>,
        @InjectModel(GlVoucherRecurring.name)
        private readonly glVoucherRecurringPag: PaginateModel<GlVoucherRecurringDocument>,
        private readonly glVoucherService: GlVoucherService,
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
    ) { }


    async create(
        req: any,
        dto: CreateGlVoucherRecurringDto,
    ): Promise<GlVoucherRecurringDocument> {
        const recurringData = await this.glVoucherRecurring.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });

        if (dto.transStatus == GLTransStatus.Approved) {
            await this.updateApproval(recurringData._id, req);
        }

        return recurringData;

    }

    async callVoucherAPI(dto: any, req: any, refId: string, date: any) {

        const items = dto.items.map(item => {
            return {
                glAccountId: item.glAccountId.toString(),
                partnerRestaurantId: item.partnerRestaurantId?.toString(),
                amount: item.amount,
                glLineType: item.glLineType,
                description: item.description,
                costCenter: item.costCenter,
                segment: item.segment,
                purpose: item.purpose,
                restaurantId: item.restaurantId?.toString(),
                glTaxIndicationId: item.glTaxIndicationId?.toString()
            };
        });

        let glVoucher;
        try {

            glVoucher = await this.glVoucherService.create(
                {
                    user: {
                        addedBy: req.user.userId,
                        supplierId: req.user.supplierId,
                    },
                },
                {
                    restaurantId: dto.restaurantId?.toString(),
                    referenceNumber: refId,
                    referenceDocNumber: dto.referenceNumber,
                    vendorId: dto.vendorId,
                    vendorName: dto.vendorName,
                    type: GlVoucherType.Recurring,
                    date: new Date(date),
                    items: items
                }
            );
        } catch (err) {
            console.log(`Failed to create gl voucher for recurring`, err);
        }
        return glVoucher;
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<GlVoucherRecurringDocument>> {

        let queryToApply: any = {};

        let startDate = null;
        let endDate = null;
        if (req.query.startDate && req.query.endDate) {

            startDate = new Date(req.query.startDate)
            endDate = new Date(req.query.endDate)

            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            endDate.setUTCHours(23);
            endDate.setUTCMinutes(59);

            queryToApply.date = {
                $gte: startDate,
                $lte: endDate,
            };
        }
        if (req.query.description) {
            queryToApply.description = { $regex: new RegExp(req.query.description, 'i') };
        }

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
        // if (req.query.minAmount > 0 || req.query.maxAmount > 0) {
        //     const amountRangeQuery: any = {};

        //     if (req.query.minAmount > 0) {
        //         amountRangeQuery.$gte = Number(req.query.minAmount);
        //     }
        //     if (req.query.maxAmount > 0) {
        //         amountRangeQuery.$lte = Number(req.query.maxAmount);
        //     }
        //     queryToApply.totalCost = amountRangeQuery;
        // }
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
        const glVendorCodes = await this.glVoucherRecurringPag.paginate(
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
                        path: 'restaurantId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            _id: 1,
                        }
                    }
                ]
            },
        );
        return glVendorCodes;
    }

    async findOne(glVendorCodeId: string): Promise<GlVoucherRecurringDocument> {
        const exists = await this.glVoucherRecurring.findById(glVendorCodeId).populate([
            {
                path: 'items.glAccountId',
                select: {
                    name: 1,
                    nameAr: 1,
                    glNumber: 1,
                },
            },
            {
                path: 'history.glVoucherId',
                select: {
                    voucherNumber: 1,
                    referenceDocNumber: 1
                }
            },
            {
                path: 'addedBy',
                select: {
                    name: 1,
                    _id: 1,
                },
            },
        ]);

        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        req: any,
        glVendorCodeId: string,
        dto: UpdateGlVoucherRecurringDto,
    ): Promise<GlVoucherRecurringDocument> {
        const glVendorCode = await this.glVoucherRecurring.findByIdAndUpdate(
            glVendorCodeId,
            dto,
            {
                new: true,
            },
        );

        if (!glVendorCode) {
            throw new NotFoundException();
        }

        return glVendorCode;
    }

    async remove(glVendorCodeId: string): Promise<boolean> {
        const glVendorCode = await this.glVoucherRecurring.findByIdAndRemove(
            glVendorCodeId,
        );

        if (!glVendorCode) {
            throw new NotFoundException();
        }
        return true;
    }

    async updateApproval(_id: string, req: any) {
        const dto = await this.glVoucherRecurring.findById(_id);


        if (!dto) {
            throw new NotFoundException();
        }
        const currentDate = moment();
        const startDate = moment(dto.startDate);
        let historyData = [];

        //** INSERT OLD ENTRIES IF START DATE IS LESS THAN TODAY */ 

        switch (dto.trigger.intervalType) {
            //** CHECK IF INTERVAL TYPE IS MONTHLY - GET NUMBER OF MONTH BASED ON CURRENTDATE-STARTDATE AND DO ENTRY FOR THAT NUMBER OF MONTHS BASED ON INTERVAL * /
            case 'Monthly':
                let numberOfMonths = currentDate.diff(startDate, 'months');
                for (let i = 0; i <= numberOfMonths; i++) {
                    const currentMonth = moment(startDate).add(i, 'months');
                    const currentYear = moment(startDate).add(i, 'years').year();
                    // Iterate over each day of the month specified in the dto
                    for (const dayOfMonth of dto.trigger.daysOfMonth) {
                        // Format the executeDate
                        let executeDate = null;
                        if (dayOfMonth == 31) {
                            executeDate = moment(currentMonth).endOf('month').format('YYYY-MM-DD');

                            console.log("last day", executeDate);
                        }
                        else {
                            executeDate = moment(currentMonth).date(dayOfMonth).format('YYYY-MM-DD');
                        }


                        if (new Date(executeDate?.toString()) <= new Date(currentDate?.toString())) {
                            console.log(`Triggering for month ${currentMonth.format('YYYY-MM')} | ${executeDate}`);
                            const voucher = await this.callVoucherAPI(dto, req, _id, executeDate);

                            if (voucher) {
                                historyData.push({
                                    postedDate: new Date(executeDate),
                                    isTriggered: true,
                                    glVoucherId: voucher._id,
                                    executionDate: new Date()
                                });
                            }
                            else {
                                historyData.push({
                                    postedDate: new Date(executeDate),
                                    isTriggered: false,
                                    glVoucherId: null,
                                    executionDate: new Date()
                                });
                            }
                        }
                    }
                }
                break;
            case 'Weekly':
                //** CHECK IF INTERVAL TYPE IS WEEKLY - GET NUMBER OF WEEK BASED ON STARTDATE AND CURRENT DATE AND DO ENTRY INTERVAL NUMBERS */

                for (let m = moment(startDate); m.isSameOrBefore(currentDate); m.add(1, 'days')) {
                    if (dto.trigger.daysOfWeek.includes(m.day())) {
                        const executeDate = m.format('YYYY-MM-DD');
                        if (new Date(executeDate?.toString()) <= new Date(currentDate?.toString())) {
                            console.log(`Triggering for ${m.format('dddd')} | ${m.format('YYYY-MM-DD')}`);

                            const voucher = await this.callVoucherAPI(dto, req, _id, executeDate);

                            if (voucher) {
                                historyData.push({
                                    postedDate: new Date(executeDate),
                                    isTriggered: true,
                                    glVoucherId: voucher._id,
                                    executionDate: new Date()
                                });
                            }
                            else {
                                historyData.push({
                                    postedDate: new Date(executeDate),
                                    isTriggered: false,
                                    glVoucherId: null,
                                    executionDate: new Date()
                                });
                            }
                        }
                    }
                }

                break;
            case 'Yearly':

                //** CHECK IF INTERVAL TYPE IS YEARLY - CHECK specificDate IS LESS THAT CURRENT DATE THEN DO THAT ENTRY  */

                // Check if specificDate is less than current date, then do the entry
                dto.trigger.specificDate.forEach(async (date) => {
                    const specificDate = moment({ year: currentDate.year(), month: date.month - 1, day: date.day });
                    if (new Date(specificDate.toDate()?.toString()) <= new Date(currentDate?.toString())) {
                        // Add logic here to handle yearly entries
                        console.log(`Triggering for specific date ${specificDate.format('YYYY-MM-DD')}`);

                        const voucher = await this.callVoucherAPI(dto, req, _id, specificDate.toDate());

                        if (voucher) {
                            historyData.push({
                                postedDate: new Date(specificDate.toDate()?.toString()),
                                isTriggered: true,
                                glVoucherId: voucher._id,
                                executionDate: new Date()
                            });
                        }
                        else {
                            historyData.push({
                                postedDate: new Date(specificDate.toDate()?.toString()),
                                isTriggered: false,
                                glVoucherId: null,
                                executionDate: new Date()
                            });
                        }
                    }
                });
                break;
            default:
                // Handle invalid interval type
                break;
        }


        dto.transStatus = GLTransStatus.Approved;
        dto.history = historyData;
        await dto.save();
    }

    @Cron('0 5 * * *')
    async recurringCronJob() {

        const currentDate = moment();
        const currentDay = moment().date();
        const lastDateOfMonth = moment().endOf('month').date();
        const currentMonth = currentDate.month() + 1;
        const currentDayNumber = currentDate.isoWeekday() + 1;

        // check all monthly
        const allrecurringMonthlyData = await this.glVoucherRecurring.find({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            "trigger.interval": { $gte: 1 },
            "trigger.intervalType": IntervalType.Monthly
        });

        for (let i = 0; i < allrecurringMonthlyData.length; i++) {
            const el: any = allrecurringMonthlyData[i];
            let historyData = el.history;
            const req = {
                user: {
                    userId: el.addedBy,
                    supplierId: el.supplierId
                }
            }
            if (el.trigger.daysOfMonth.includes(currentDay)
                || (el.trigger.daysOfMonth.includes(31) && currentDay == lastDateOfMonth)) {
                let executeDate = null;
                if (el.trigger.daysOfMonth.includes(31) && currentDay == lastDateOfMonth) {
                    executeDate = moment(currentMonth).date(lastDateOfMonth).format('YYYY-MM-DD');
                } else {
                    executeDate = moment(currentMonth).date(currentDay).format('YYYY-MM-DD');
                }
                const voucher = await this.callVoucherAPI(el, req, el._id, executeDate);
                if (voucher) {
                    historyData.push({
                        postedDate: new Date(executeDate),
                        isTriggered: true,
                        glVoucherId: voucher._id,
                        executionDate: new Date()
                    });
                }
                else {
                    historyData.push({
                        postedDate: new Date(executeDate),
                        isTriggered: false,
                        glVoucherId: null,
                        executionDate: new Date()
                    });
                }
            }

            el.history = historyData();
            await el.save();
        }

        //check all weekly
        const allrecurringWeeklyData = await this.glVoucherRecurring.find({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            "trigger.interval": { $gte: 1 },
            "trigger.intervalType": IntervalType.Weekly
        });

        for (let i = 0; i < allrecurringWeeklyData.length; i++) {
            const el: any = allrecurringWeeklyData[i];
            let historyData = el.history;
            const req = {
                user: {
                    userId: el.addedBy,
                    supplierId: el.supplierId
                }
            }
            if (el.trigger.daysOfWeek.includes(currentDayNumber)) {
                const executeDate = moment(currentMonth).date(currentDay).format('YYYY-MM-DD');
                const voucher = await this.callVoucherAPI(el, req, el._id, executeDate);
                if (voucher) {
                    historyData.push({
                        postedDate: new Date(executeDate),
                        isTriggered: true,
                        glVoucherId: voucher._id,
                        executionDate: new Date()
                    });
                }
                else {
                    historyData.push({
                        postedDate: new Date(executeDate),
                        isTriggered: false,
                        glVoucherId: null,
                        executionDate: new Date()
                    });
                }
            }
            el.history = historyData();
            await el.save();
        }

        //check all Yearly
        const allrecurringYearlyData = await this.glVoucherRecurring.find({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            "trigger.interval": { $gte: 1 },
            "trigger.intervalType": IntervalType.yearly,
            "trigger.specificDate": {
                $elemMatch: {
                    day: currentDay,
                    month: currentMonth
                }
            }
        });

        for (let i = 0; i < allrecurringYearlyData.length; i++) {
            const el: any = allrecurringYearlyData[i];
            let historyData = el.history;
            const req = {
                user: {
                    userId: el.addedBy,
                    supplierId: el.supplierId
                }
            }
            const executeDate = moment(currentMonth).date(currentDay).format('YYYY-MM-DD');
            const voucher = await this.callVoucherAPI(el, req, el._id, executeDate);
            if (voucher) {
                historyData.push({
                    postedDate: new Date(executeDate),
                    isTriggered: true,
                    glVoucherId: voucher._id,
                    executionDate: new Date()
                });
            }
            else {
                historyData.push({
                    postedDate: new Date(executeDate),
                    isTriggered: false,
                    glVoucherId: null,
                    executionDate: new Date()
                });
            }
            el.history = historyData();
            await el.save();
        }

    }
}