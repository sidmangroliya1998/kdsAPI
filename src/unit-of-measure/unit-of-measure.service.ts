import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  UnitOfMeasure,
  UnitOfMeasureDocument,
} from './schemas/unit-of-measure.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { QueryUnitOfMeasureDto } from './dto/query-unit-of-measure.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import configureMeasurements, {
  AllMeasures,
  AllMeasuresSystems,
  AllMeasuresUnits,
  allMeasures,
} from 'convert-units';
import { ConvertUomDto } from './dto/convert-uom.dto';
import { UnitOfMeasureHelperService } from './unit-of-measure-helper.service';
import * as convert from 'convert-units';
import { User, UserDocument } from 'src/users/schemas/users.schema';


@Injectable()
export class UnitOfMeasureService {
  constructor(
    @InjectModel(UnitOfMeasure.name)
    private readonly unitOfMeasureModel: Model<UnitOfMeasureDocument>,
    @InjectModel(UnitOfMeasure.name)
    private readonly unitOfMeasureModelPag: PaginateModel<UnitOfMeasureDocument>,
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(
    req: any,
    dto: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureDocument> {

    return await this.unitOfMeasureModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
    });
  }

  async findAll(
    req: any,
    query: QueryUnitOfMeasureDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<UnitOfMeasureDocument>> {
    let queryToApply: any = query;
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    let getAllRest: any = [];

    if (req?.user?.userId && req.user?.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (query.restaurantId) {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(query.restaurantId)] } }
        ];
      } else {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: [new mongoose.Types.ObjectId(query.restaurantId)] } }
        ];
      }
    } else {
      if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
        queryToApply.$or = [
          { availableRestaurants: [] },
          { availableRestaurants: { $exists: false } },
          { availableRestaurants: { $in: getAllRest?.restaurantId } }
        ];
      }
    }
    const records = await this.unitOfMeasureModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
        baseUnit: { $ne: null },
        deletedAt: null,
      },
      {
        sort: DefaultSort,
        lean: true,
        ...paginateOptions,
        ...pagination,
      },
    );
    return records;
  }

  async findOne(
    unitOfMeasureId: string,
    i18n: I18nContext,
  ): Promise<UnitOfMeasureDocument> {
    const exists = await this.unitOfMeasureModel.findById(unitOfMeasureId);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return exists;
  }

  async findRelated(
    req: any,
    unitOfMeasureId: string,
    i18n: I18nContext,
  ): Promise<UnitOfMeasureDocument[]> {
    const exists = await this.unitOfMeasureModel.findById(unitOfMeasureId);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    if (exists.baseUnit) {
      await exists.populate([
        {
          path: 'baseUnit',
        },
      ]);
    }
    let queryToApply: any = {};
    let getAllRest: any = [];

    if (req?.user?.userId && req.user?.userId != '') {
      getAllRest = await this.userModel.findById(req.user.userId);
    }

    if (getAllRest && getAllRest?.restaurantId && getAllRest?.restaurantId?.length > 0) {
      queryToApply.$or = [
        { availableRestaurants: [] },
        { availableRestaurants: { $exists: false } },
        { availableRestaurants: { $in: getAllRest?.restaurantId } }
      ];
    }

    const uoms = await this.unitOfMeasureModel.find({
      supplierId: req.user?.supplierId,
      deletedAt: null,
      baseUnit: { $ne: null },
      measure: exists.measure ?? exists.baseUnit.measure
    });

    const customUoms1 = await this.unitOfMeasureModel.find({
      supplierId: req.user?.supplierId,
      baseUnit: { $in: uoms.map((u) => u._id) },
      ...queryToApply,
    });

    let alluoms = [];

    for (let i = 0; i < customUoms1.length; i++) {
      const el = customUoms1[i];
      let currentBaseUnit = el._id;
      while (currentBaseUnit) {
        const customUoms = await this.unitOfMeasureModel.findOne({
          supplierId: req.user?.supplierId,
          baseUnit: currentBaseUnit,
          ...queryToApply,
        });
        if (!customUoms) {
          break;
        }
        alluoms.push(customUoms);

        currentBaseUnit = customUoms._id;
      }
    }

    return uoms.concat(customUoms1, alluoms);
  }

  async update(
    unitOfMeasureId: string,
    dto: UpdateUnitOfMeasureDto,
    i18n: I18nContext,
  ): Promise<UnitOfMeasureDocument> {
    const unitOfMeasure = await this.unitOfMeasureModel.findByIdAndUpdate(
      unitOfMeasureId,
      dto,
      {
        new: true,
      },
    );

    if (!unitOfMeasure) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    return unitOfMeasure;
  }

  async remove(unitOfMeasureId: string, i18n: I18nContext): Promise<boolean> {
    const unitOfMeasure = await this.unitOfMeasureModel.findByIdAndUpdate(
      unitOfMeasureId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!unitOfMeasure) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async convert(dto: ConvertUomDto) {
    return await this.unitOfMeasureHelperService.getConversionFactor(
      dto.sourceUom,
      dto.targetUom,
    );
  }

  async loadSystemUoms() {
    const unitsToLoad = ['length', 'mass', 'volume', 'pieces'];
    const convert = configureMeasurements<
      AllMeasures,
      AllMeasuresSystems,
      AllMeasuresUnits
    >(allMeasures);
    const units = convert().list();
    for (const i in units) {

      if (unitsToLoad.includes(units[i].measure)) {
        await this.unitOfMeasureModel.findOneAndUpdate(
          {
            abbr: units[i].abbr,
            system: units[i].system,
          },
          {
            name: units[i].singular,
            nameAr: units[i].singular,
            measure: units[i].measure,
            abbr: units[i].abbr,
            system: units[i].system,
          },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }
    }
  }

  async adddefaultUoMs(req: any) {
    const unitsToLoad = ['length', 'mass', 'volume', 'pieces'];
    const convert = configureMeasurements<
      AllMeasures,
      AllMeasuresSystems,
      AllMeasuresUnits
    >(allMeasures);
    const units = convert().list();

    let customUoM = [];
    for (const i in units) {
      if (unitsToLoad.includes(units[i].measure)) {
        const respData = await this.unitOfMeasureModel.create(
          {
            name: units[i].singular,
            nameAr: units[i].singular,
            measure: units[i].measure,
            abbr: units[i].abbr,
            supplierId: req.user.supplierId
          }
        );
        customUoM.push({
          name: units[i].singular,
          id: respData?._id
        });
      }
    }

    const defaultUOM =
      [
        {
          name: "Kilogram",
          nameAr: "كيلوغرام",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Kilogram')?.id,
          measure: "Weight",
          supplierId: req.user.supplierId
        },
        {
          name: "Gram",
          nameAr: "جرام",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Gram')?.id,
          measure: "Weight",
          supplierId: req.user.supplierId
        },
        {
          name: "Ton",
          nameAr: "طن",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Ton')?.id,
          measure: "Weight",
          supplierId: req.user.supplierId
        },
        {
          name: "LB",
          nameAr: "رطل",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Pound')?.id,
          measure: "Weight",
          supplierId: req.user.supplierId
        },
        {
          name: "Litre",
          nameAr: "لتر",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Litre')?.id,
          measure: "Volume",
          supplierId: req.user.supplierId
        },
        {
          name: "Millilitre",
          nameAr: "مل",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Millilitre')?.id,
          measure: "Volume",
          supplierId: req.user.supplierId
        },
        {
          name: "Piece",
          nameAr: "قطعة",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Piece')?.id,
          measure: "pieces",
          supplierId: req.user.supplierId
        },

        {
          name: "Meter",
          nameAr: "متر",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Meter')?.id,
          measure: "length",
          supplierId: req.user.supplierId
        },
        {
          name: "KiloMeter",
          nameAr: "كيلومتر",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Kilometer')?.id,
          measure: "length",
          supplierId: req.user.supplierId
        },
        {
          name: "Mile",
          nameAr: "ميل",
          baseConversionRate: 1,
          baseUnit: customUoM.find((f: any) => f.name == 'Mile')?.id,
          measure: "length",
          supplierId: req.user.supplierId
        },
      ]
    await this.unitOfMeasureModel.insertMany(defaultUOM);

  }

}
