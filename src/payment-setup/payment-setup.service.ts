import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, PaginateModel, PaginateResult } from 'mongoose';

import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { CreatePaymentSetupDto } from './dto/create-payment-setup.dto';
import { UpdatePaymentSetupDto } from './dto/update-payment-setup.dto';
import {
  PaymentSetup,
  PaymentSetupDocument,
} from './schemas/payment-setup.schema';
import { QueryPaymentSetupDto } from './dto/query-payment-setup.dto';
import { PaymentBankFees, PaymentBankFeesDocument } from './schemas/payment-bank-fees.schema';
import { CreatePaymentBankFeesDto } from './dto/create-payment-bank-fees.dto';
import { PaymentFees, PaymentFeesDocument } from './schemas/payment-fees.schema';
import { CreatePaymentFeesDto } from './dto/create-payment-fees.dto';
import { GlVoucherHelperService } from 'src/accounting/gl-voucher-helper.service';
import { roundOffNumber } from 'src/core/Helpers/universal.helper';

@Injectable()
export class PaymentSetupService {
  constructor(
    @InjectModel(PaymentSetup.name)
    private readonly paymentSetupModel: Model<PaymentSetupDocument>,
    @InjectModel(PaymentSetup.name)
    private readonly paymentSetupModelPag: PaginateModel<PaymentSetupDocument>,

    @InjectModel(PaymentBankFees.name)
    private readonly paymentBankFeesModel: Model<PaymentBankFeesDocument>,

    @InjectModel(PaymentFees.name)
    private readonly paymentFeesModel: Model<PaymentFeesDocument>,

    @InjectModel(PaymentFees.name)
    private readonly paymentFeesModelPeg: PaginateModel<PaymentFeesDocument>,

    private readonly glVoucherHelperService: GlVoucherHelperService,
  ) { }

  async create(
    req: any,
    dto: CreatePaymentSetupDto,
  ): Promise<PaymentSetupDocument> {
    return await this.paymentSetupModel.findOneAndUpdate(
      {
        supplierId: req.user.supplierId,
        active: true,
      },
      {
        ...dto,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId,
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  async findAll(
    req: any,
    query: QueryPaymentSetupDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PaymentSetupDocument>> {
    const paymentSetups = await this.paymentSetupModelPag.paginate(
      {
        ...query,
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          }
        ]
      },
    );

    if (paymentSetups?.docs?.length == 0) {
      return await this.paymentSetupModelPag.paginate(
        {
          supplierId: req.user.supplierId,
        },
        {
          sort: DefaultSort,
          lean: true,
          ...paginateOptions,
          ...pagination,
          populate: [
            {
              path: 'restaurantId',
              select: {
                name: 1,
                nameAr: 1,
                _id: 1,
              },
            }
          ]
        },
      );
    }


    return paymentSetups;
  }

  async findOne(paymentSetupId: string): Promise<PaymentSetupDocument> {
    const exists = await this.paymentSetupModel.findById(paymentSetupId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async findOneBySupplier(supplierId: string): Promise<PaymentSetupDocument> {
    const exists = await this.paymentSetupModel.findOne({ supplierId });

    return exists;
  }

  async update(
    paymentSetupId: string,
    dto: UpdatePaymentSetupDto,
  ): Promise<PaymentSetupDocument> {
    const paymentSetup = await this.paymentSetupModel.findByIdAndUpdate(
      paymentSetupId,
      dto,
      {
        new: true,
      },
    );

    if (!paymentSetup) {
      throw new NotFoundException();
    }

    return paymentSetup;
  }

  async remove(paymentSetupId: string): Promise<boolean> {
    const paymentSetup = await this.paymentSetupModel.findByIdAndRemove(
      paymentSetupId,
    );

    if (!paymentSetup) {
      throw new NotFoundException();
    }
    return true;
  }

  /* Payment Bank Fees */

  async createBankFees(
    req: any,
    dto: CreatePaymentBankFeesDto,
  ): Promise<PaymentBankFeesDocument> {
    return await this.paymentBankFeesModel.findOneAndUpdate(
      {
        supplierId: req.user.supplierId,
      },
      {
        ...dto,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId,
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }


  async findAllBankFees(
    req: any
  ): Promise<any> {
    const paymentSetups = await this.paymentBankFeesModel.find(
      {
        supplierId: req.user.supplierId,
      }
    );
    return paymentSetups;
  }


  async createPaymentFees(req: any, dto: CreatePaymentFeesDto): Promise<PaymentFeesDocument> {

    const feesData = await this.paymentBankFeesModel.find({
      supplierId: req.user.supplierId,
    });

    let madaFees = 0;
    let visaMasterFees = 0;
    let americanExpressFees = 0;
    let madaTax = 0;
    let visaMasterTax = 0;
    let americanExpressTax = 0;

    madaFees = roundOffNumber(dto.madaCard * (feesData[0].bankFees?.madaCard / 100), 3);
    visaMasterFees = roundOffNumber(dto.visaMaster * (feesData[0].bankFees?.visaMaster / 100), 3);
    americanExpressFees = roundOffNumber(dto.americalExpress * (feesData[0].bankFees?.americalExpress / 100), 3);
    madaTax = roundOffNumber(madaFees * 0.15, 3);
    visaMasterTax = roundOffNumber(visaMasterFees * 0.15, 3);
    americanExpressTax = roundOffNumber(americanExpressFees * 0.15, 3);
    const postFix = (new Date().getFullYear() % 100) + '-';
    let counter = 1;
    let _lastDocNo = await this.paymentFeesModel.findOne(
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
      _lastDocNo.docNumber = _lastDocNo.docNumber.replace('PB-', '');
      const arr = _lastDocNo.docNumber.split('-');
      if (arr.length > 0) {
        counter = parseInt(arr[1], 10) + 1;
      }
    }
    const _docNumber = 'PB-' + postFix + String(counter).padStart(5, '0');

    const resp = await this.paymentFeesModel.create({
      ...dto,
      docNumber: _docNumber,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      madaCardFee: madaFees,
      visaMasterFee: visaMasterFees,
      americalExpressFee: americanExpressFees,
      madaCardTax: madaTax,
      visaMasterTax: visaMasterTax,
      americalExpressTax: americanExpressTax,
      totalFees: madaFees + visaMasterFees + americanExpressFees,
      totalTax: madaTax + visaMasterTax + americanExpressTax,
      totalAmount: dto.madaCard + dto.americalExpress + dto.visaMaster
    });


    await this.glVoucherHelperService.handlePaymentBankFees(resp);
    return resp;
  }

  async findAllFeesData(
    req: any,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<PaymentFeesDocument>> {
    const paymentSetups = await this.paymentFeesModelPeg.paginate(
      {
        supplierId: req.user.supplierId,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
        populate: [
          { path: 'addedBy', select: { name: 1 } },
          {
            path: 'glVoucherId',
            select: {
              voucherNumber: 1
            }
          },
          {
            path: 'glAccountIdFees',
            select: {
              _id: 1,
              name: 1,
              nameAr: 1,
              glNumber: 1
            }
          },
          {
            path: 'glAccountIdBank',
            select: {
              _id: 1,
              name: 1,
              nameAr: 1,
              glNumber: 1
            }
          },
          {
            path: 'restaurantId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          }
        ],
      },
    );
    return paymentSetups;
  }

}
