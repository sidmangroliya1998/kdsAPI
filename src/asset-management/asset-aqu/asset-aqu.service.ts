import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
    DefaultSort,
    PaginationDto,
    pagination,
} from 'src/core/Constants/pagination';
import { AssetAqu, AssetAquDocument } from './schemas/asset-aqu.schema';
import { CreateAssetAquDto } from './dto/create-asset-aqu.dto';
import { UpdateAssetAquDto } from './dto/update-asset-aqu.dto';
import * as moment from 'moment';
import { AssetAquTrans, AssetAquTransDocument } from './schemas/asset-aqu-transaction.schema';
import { CreateAssetAquTransactionDto } from './dto/create-asset-aqu-transaction.dto';
import { AssetAquDep, AssetAquDepDocument } from './schemas/asset-aqu-dep.schema';
import { CreateAssetAquDepDto } from './dto/create-asset-dep.dto';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { CreateAssetRetirementDto } from './dto/create-asset-retirement.dto';
import { AssetRetirement, AssetRetirementDocument } from './schemas/asset-retirement.schema';
import { TaxIndication } from 'src/expense/enum/en';
import { Tax } from 'src/core/Constants/tax-rate.constant';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';
import { SequenceService } from 'src/sequence/sequence.service';
import { ObjectType } from 'src/sequence/enum/en';

@Injectable()
export class AssetAquService {
    constructor(
        @InjectModel(AssetAqu.name)
        private readonly assetMasterModel: Model<AssetAquDocument>,
        @InjectModel(AssetAqu.name)
        private readonly assetAquModelPag: PaginateModel<AssetAquDocument>,

        @InjectModel(AssetAquTrans.name)
        private readonly assetAquTransModel: Model<AssetAquTransDocument>,
        @InjectModel(AssetAquTrans.name)
        private readonly assetAquTransModelPag: PaginateModel<AssetAquTransDocument>,

        @InjectModel(AssetAquDep.name)
        private readonly assetAquDepModel: Model<AssetAquDepDocument>,
        @InjectModel(AssetAquDep.name)
        private readonly assetAquDepModelPag: PaginateModel<AssetAquDepDocument>,

        @InjectModel(AssetRetirement.name)
        private readonly assetRetirementModel: Model<AssetRetirementDocument>,
        @InjectModel(AssetRetirement.name)
        private readonly assetRetirementModelPag: PaginateModel<AssetRetirementDocument>,

        private readonly glVoucherHelperService: GlVoucherHelperService,

        private sequenceService: SequenceService,
    ) { }

    async create(
        req: any,
        dto: CreateAssetAquDto,
    ): Promise<AssetAquDocument> {
        const sequence = await this.sequenceService.createAndUpdate(ObjectType.Assets, req.user.supplierId, 'a')
        
        return await this.assetMasterModel.create({
            ...dto,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
            sequenceNumber: sequence.sequenceValue
        });
    }

    async findAll(
        req: any,
        paginateOptions: PaginationDto,
    ): Promise<any> {
        const assetAquData: any = await this.assetAquModelPag.paginate(
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
                    {
                        path: 'glAssetCategoryId',
                        select: {
                            name: 1,
                            nameAr: 1,
                            _id: 1,
                        },
                    }
                ]
            },
        );

        const depreciateList = await this.assetAquDepModel.find(
            {
                supplierId: req.user.supplierId,
            },
            {
                items: 1, totalAmount: 1
            });


        // Modify the response with the updated docs array
        const modifiedResponse = {
            docs: assetAquData,
            depreciateList: depreciateList
        };


        return modifiedResponse;
    }

    async findOne(assetAquId: string): Promise<any> {
        const exists = await this.assetMasterModel.findById(assetAquId);
        if (!exists) {
            throw new NotFoundException();
        }

        return exists;
    }

    async update(
        assetAquId: string,
        dto: UpdateAssetAquDto,
    ): Promise<AssetAquDocument> {
        const assetAquData = await this.assetMasterModel.findByIdAndUpdate(
            assetAquId,
            dto,
            {
                new: true,
            },
        );

        if (!assetAquData) {
            throw new NotFoundException();
        }

        return assetAquData;
    }

    async remove(assetAquId: string): Promise<boolean> {
        const assetAquData = await this.assetMasterModel.findByIdAndRemove(
            assetAquId,
        );

        if (!assetAquData) {
            throw new NotFoundException();
        }

        return true;
    }

    async createAquTransaction(req: any, dto: CreateAssetAquTransactionDto): Promise<AssetAquTransDocument> {
        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.assetAquTransModel.findOne(
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('AQ-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'AQ-' + postFix + String(counter).padStart(5, '0');

        if (dto.taxIndication == TaxIndication.Included) {
            dto.net = roundOffNumber(
                dto.grossAmount / (1 + Tax.rate / 100),
            );
            dto.tax = roundOffNumber(
                dto.grossAmount - dto.net,
            );
        } else if (dto.taxIndication == TaxIndication.NotRelavant) {
            dto.net = roundOffNumber(dto.grossAmount);
            dto.tax = 0;
        } else if (dto.taxIndication == TaxIndication.NotIncluded) {
            dto.net = roundOffNumber(dto.grossAmount);
            dto.grossAmount += dto.tax ?? 0;
        }

        const assetAquTrans = await this.assetAquTransModel.create({
            ...dto,
            docNumber: _docNumber,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });


        const exists = await this.assetMasterModel.findById(dto.assetAquId);
        if (exists) {
            const plannedDepreciationValue = dto.net / exists.lifeSpanNo / 12;
            await this.assetMasterModel.findByIdAndUpdate(
                dto.assetAquId,
                {
                    aquisitionDate: dto.date,
                    acquisitionValue: dto.amount,
                    plannedDepreciationValue: plannedDepreciationValue,
                    totalNet: dto.net,
                    totalTax: dto.tax
                },
            );
        }

        const aquFullData = await this.assetAquTransModel.find(
            { _id: assetAquTrans._id }).populate([
                {
                    path: 'assetAquId',
                    populate: [

                        {
                            path: 'glAssetCategoryId'
                        }
                    ]
                },
                {
                    path: 'vendorId'
                },
            ]);

        await this.glVoucherHelperService.handleAssetAuqTransaction(aquFullData[0], assetAquTrans);
        return assetAquTrans;
    }

    async findAllAquTransaction(req: any, paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetAquTransDocument>> {
        const assetAquTransData: any = await this.assetAquTransModelPag.paginate(
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
                    {
                        path: 'assetAquId'
                    },
                    {
                        path: 'glVoucherId',
                        select: {
                            voucherNumber: 1
                        }
                    },

                ]
            },
        );

        return assetAquTransData;
    }

    async createAquDepreciation(req: any, dto: CreateAssetAquDepDto)
        : Promise<AssetAquDepDocument> {

        if (moment(dto.date).isBefore(moment().startOf('day'))) {
            throw new BadRequestException('Depreciation date should be less than current date');
        }

        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.assetAquDepModel.findOne(
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('AD-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'AD-' + postFix + String(counter).padStart(5, '0');

        dto.items = dto.items.map(item => (
            { ...item, monthNumber: dto.monthNumber, yearNumber: dto.yearNumber }));

        const depResp = await this.assetAquDepModel.create({
            ...dto,
            docNumber: _docNumber,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });
        for (let i = 0; i < dto.items.length; i++) {
            const el = dto.items[i];
            let depValue = 0;
            let nbv = 0;
            let accumvalue = 0;
            const exists = await this.assetMasterModel.findById(el.assetAquId);

            // const NumberOfDepreciationMonth =
            //     moment().isSame(dto.date, 'month')
            //         ? 1
            //         : Math.ceil(moment().diff(dto.date, 'months', true));

            depValue = el.amount;
            accumvalue = exists.accumValue + el.amount;
            nbv = exists.totalNet - accumvalue;

            await this.assetMasterModel.findByIdAndUpdate(
                el.assetAquId,
                {
                    depreciationDate: dto.date,
                    depreciationValue: depValue,
                    nbvValue: nbv,
                    accumValue: accumvalue
                },
            );
        }

        const aquFullData = await this.assetAquDepModel.find(
            { _id: depResp._id }).populate([
                {
                    path: 'items.assetAquId',
                    populate: [
                        {
                            path: 'glAssetCategoryId'
                        }
                    ]
                }
            ]);

        await this.glVoucherHelperService.handleAssetDepreciation(aquFullData[0], depResp);

        return depResp;
    }

    async findAllAquDepreciation(req: any, paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetAquDepDocument>> {
        const assetAquDepData: any = await this.assetAquDepModelPag.paginate(
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
                    {
                        path: 'items.assetAquId'
                    },
                    {
                        path: 'glVoucherId',
                        select: {
                            voucherNumber: 1
                        }
                    },

                ]
            },
        );

        return assetAquDepData;
    }

    async createAquRetirement(req: any, dto: CreateAssetRetirementDto)
        : Promise<AssetRetirementDocument> {

        const postFix = (new Date().getFullYear() % 100) + '-';
        let counter = 1;
        let _lastDocNo = await this.assetRetirementModel.findOne(
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
            _lastDocNo.docNumber = _lastDocNo.docNumber.replace('AR-', '');
            const arr = _lastDocNo.docNumber.split('-');
            if (arr.length > 0) {
                counter = parseInt(arr[1], 10) + 1;
            }
        }
        const _docNumber = 'AR-' + postFix + String(counter).padStart(5, '0');

        await this.assetMasterModel.findByIdAndUpdate(
            dto.assetAquId,
            {
                retirementDate: dto.retirementDate,
                isRetired: true
            },
        );

        const retirementResp = await this.assetRetirementModel.create({
            ...dto,
            docNumber: _docNumber,
            supplierId: req.user.supplierId,
            addedBy: req.user.userId,
        });

        const aquFullData = await this.assetRetirementModel.find(
            { _id: retirementResp._id }).populate([
                {
                    path: 'assetAquId',
                    populate: [
                        {
                            path: 'glAssetCategoryId'
                        }
                    ]
                }
            ]);

        await this.glVoucherHelperService.handleAssetRetirement(aquFullData[0], retirementResp);

        return retirementResp;
    }

    async findAllAssetRetirement(req: any, paginateOptions: PaginationDto,
    ): Promise<PaginateResult<AssetRetirementDocument>> {
        const assetAquTransData: any = await this.assetRetirementModelPag.paginate(
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
                    {
                        path: 'assetAquId'
                    },
                    {
                        path: 'glVoucherId',
                        select: {
                            voucherNumber: 1
                        }
                    },

                ]
            },
        );

        return assetAquTransData;
    }

}
