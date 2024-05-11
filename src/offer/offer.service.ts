import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, PaginateModel, PaginateResult } from 'mongoose';

import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { QueryOfferDto } from './dto/query-offer.dto';
import * as moment from 'moment';
import mongoose from 'mongoose';
import Excel = require('exceljs');
import { OfferTemplate } from 'src/new-client-mgmt/constant/template.constant';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
    @InjectModel(Offer.name)
    private readonly offerModelPag: PaginateModel<OfferDocument>,
  ) { }

  async create(req: any, dto: CreateOfferDto): Promise<OfferDocument> {
    return await this.offerModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    query: QueryOfferDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<OfferDocument>> {
    let queryToApply: any = {};
    let startDate = new Date();
    let endDate = new Date();

    // if (req.query.startDate && req.query.endDate) {
    //   startDate = new Date(req.query.startDate);
    //   endDate = new Date(req.query.endDate);
    //   startDate.setUTCHours(0);
    //   startDate.setUTCMinutes(0);
    //   endDate.setUTCHours(23);
    //   endDate.setUTCMinutes(59);

    //   queryToApply["start"] = { $gte: startDate, $lt: endDate };
    //   queryToApply["end"] = { $gte: startDate, $lt: endDate };
    //   delete query.startDate;
    //   delete query.endDate;
    // }

    if (req.query.menuItemIds) {
      queryToApply["menuItemIds"] = {
        $elemMatch: { $in: req.query.menuItemIds.split(',').map(id => new mongoose.Types.ObjectId(id)) }
      }
      delete query.menuItemIds;
    }
    if (req.query.menuCategoryIds) {
      queryToApply["menuCategoryIds"] = {
        $elemMatch: { $in: req.query.menuCategoryIds.split(',').map(id => new mongoose.Types.ObjectId(id)) }
      }
      delete query.menuCategoryIds;
    }
    queryToApply = { ...queryToApply, ...query };

    const offers = await this.offerModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
        deletedAt: null,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return offers;
  }

  async findOne(offerId: string): Promise<OfferDocument> {
    const exists = await this.offerModel.findById(offerId);

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async findByCode(req, code: string): Promise<OfferDocument> {
    const exists = await this.offerModel.findOne({
      supplierId: req.user.supplierId,
      code,
      active: true,
      deletedAt: null,
      start: {
        $lte: new Date(moment.utc().format('YYYY-MM-DD')),
      },
      end: {
        $gte: new Date(moment.utc().format('YYYY-MM-DD')),
      },
    });

    if (!exists) {
      throw new NotFoundException();
    }
    if (exists.maxNumberAllowed && exists.maxNumberAllowed <= exists.totalUsed)
      throw new NotFoundException(`Coupon is used to its max capacity`);
    return exists;
  }

  async update(offerId: string, dto: UpdateOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel.findByIdAndUpdate(offerId, dto, {
      new: true,
    });

    if (!offer) {
      throw new NotFoundException();
    }

    return offer;
  }

  async remove(offerId: string): Promise<boolean> {
    const offer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!offer) {
      throw new NotFoundException();
    }
    return true;
  }

  async offerFileUploadProcess(req, file: Express.Multer.File) {
    file = file[0];

    const workBook = new Excel.Workbook();
    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);
    console.log("worksheet", worksheet)

    try {
      let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
        name: row.getCell(OfferTemplate.name).text,
        nameAr: row.getCell(OfferTemplate.nameAr).text,
        start: new Date(row.getCell(OfferTemplate.start).text),
        end: new Date(row.getCell(OfferTemplate.end).text),
        code: row.getCell(OfferTemplate.code).text,
        offerType: row.getCell(OfferTemplate.offerType).text,
        applicationType: row.getCell(OfferTemplate.applicationType).text,
        discountType: row.getCell(OfferTemplate.discountType).text,
        discount: row.getCell(OfferTemplate.discount).value,
        maxDiscount: row.getCell(OfferTemplate.maxDiscount).value,
        maxNumberAllowed: row.getCell(OfferTemplate.maxNumberAllowed).value,
        priority: 1,
        startTime: "00:00 am",
        endTime: "23:59 pm",
        showName: true,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId
      }));

      dtoArray = dtoArray.filter((f: any) => f.name != '' && f.code != '');

      console.log(dtoArray, "dtoArray")
      // Validate start and end date format
      // const isValidFormat = dtoArray.every(row => {
      //   return moment(row.start, 'YYYY-MM-DD', true).isValid() && moment(row.end, 'YYYY-MM-DD', true).isValid();
      // });
      // if (!isValidFormat) throw new BadRequestException("Start and end dates must be in 'YYYY-MM-DD' format.");

      dtoArray = dtoArray.filter((f: any) => f.name != '' && f.nameAr != '');
      this.offerModel.insertMany(dtoArray);
    } catch (err) {
      console.log("Err", err);
    }
    return true;
  }
}
