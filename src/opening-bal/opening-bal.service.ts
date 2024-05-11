
import { InjectModel } from '@nestjs/mongoose';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OpeningBal, OpeningBalDocument } from './schemas/opening-bal.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { CreateOpeningBalDto } from './dto/create-opening-bal.dto';
import {
    DefaultSort,
    PaginationDto,
    pagination,

} from 'src/core/Constants/pagination';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { QueryOpeningBalDto } from './dto/query-opening-bal.dto';
import { GlAccount, GlAccountDocument } from 'src/gl-account/schemas/gl-account.schema';

@Injectable()
export class OpeningBalService {
    constructor(
        @InjectModel(OpeningBal.name)
        private readonly openingBalModel: Model<OpeningBalDocument>,
        @InjectModel(OpeningBal.name)
        private readonly openingBalModelPag: PaginateModel<OpeningBalDocument>,
        private readonly glVoucherHelperService: GlVoucherHelperService,
        @InjectModel(GlAccount.name)
        private readonly glAccountModel: Model<GlAccountDocument>,
    ) {

    }

    async create(req: any, dto: CreateOpeningBalDto): Promise<OpeningBalDocument> {

        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.openingBalModel.findOne(
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('OS-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'OS-' + postFix + String(counter).padStart(5, '0');

        const openingBalRes = await this.openingBalModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
            docNumber: _docNumber
        });

        const items = await Promise.all(
            dto?.items.map(async (el) => {
                const glAcc = await this.glAccountModel.findById(el.glAccountId);
                return {
                    glAccountId: el.glAccountId,
                    glLineType: this.getNatureOfAccount(glAcc?.glNumber, Number(el.amount)),
                    amount: Math.abs(Number(el.amount)),
                };
            }) || []
        );

        const totalCR = items
            .filter((item) => item.glLineType === "CR")
            .reduce((total, item) => total + item.amount, 0);

        const totalDR = items
            .filter((item) => item.glLineType === "DR")
            .reduce((total, item) => total + item.amount, 0);

        if (totalDR > totalCR) {
            items.push({
                glAccountId: dto?.glAccountId,
                glLineType: "CR",
                amount: Math.abs(totalDR - totalCR),
            });
        } else {
            items.push({
                glAccountId: dto?.glAccountId,
                glLineType: "DR",
                amount: Math.abs(totalCR - totalDR),
            });
        }

        await this.glVoucherHelperService.handleOpeningBalance(openingBalRes, items);
        return openingBalRes;
    }

    async findAll(
        req: any,
        query: QueryOpeningBalDto,
        paginateOptions: PaginationDto,
    ): Promise<PaginateResult<OpeningBalDocument>> {
        const queryToApply: any = {};

        console.log("query", query)

        if (query.startDate && query.endDate) {
            query.startDate.setUTCHours(0);
            query.startDate.setUTCMinutes(0);
            query.endDate.setUTCHours(23);
            query.endDate.setUTCMinutes(59);
            queryToApply.date = {
                $gte: query.startDate,
                $lte: query.endDate,
            };
        }

        const glVouchers = await this.openingBalModelPag.paginate(
            { supplierId: req.user.supplierId, ...queryToApply },
            {
                sort: DefaultSort,
                lean: true,
                ...paginateOptions,
                ...pagination,
                populate: [
                    {
                        path: 'glAccountId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            glNumber: 1,
                        },
                    },
                    {
                        path: 'glVoucherId',
                        populate: {
                            path: 'items.glAccountId'
                        }
                    },
                    {
                        path: 'restaurantId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            _id: 1,
                        },
                    },
                ],
            },
        );


        return glVouchers;
    }

    async findOne(openingBalId: string): Promise<OpeningBalDocument> {
        const exists = await this.openingBalModel.findById(openingBalId).populate([
            {
                path: 'items.glAccountId',
                select: {
                    name: 1,
                    nameAr: 1,
                    glNumber: 1,
                },
            },
        ]);
        if (!exists) {
            throw new NotFoundException();
        }
        return exists;
    }

    getNatureOfAccount = (glNumber, amount) => {
        if (glNumber?.toString().startsWith("1") || glNumber?.toString().startsWith("5")) {
            return amount > 0 ? "DR" : "CR";
        } else {
            return amount > 0 ? "CR" : "DR";
        }
    };

}