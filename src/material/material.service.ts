import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Material, MaterialDocument } from './schemas/material.schema';
import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import { MatUomUpdate, QueryMaterialDto } from './dto/query-material.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { I18nContext } from 'nestjs-i18n';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { RestaurantMaterialDto } from './dto/restaurant-material.dto';
import {
  RestaurantMaterial,
  RestaurantMaterialDocument,
} from './schemas/restaurant-material.schema';
import Excel = require('exceljs');
import { UnitOfMeasure, UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { Inventory, InventoryDocument } from 'src/inventory/schemas/inventory.schema';
import { InventoryHistory, InventoryHistoryDocument } from 'src/inventory/schemas/inventory-history.schema';
import { Recipe, RecipeDocument } from 'src/recipe/schema/recipe.schema';
import { PurchaseOrder, PurchaseOrderDocument } from 'src/purchase-order/schemas/purchase-order.schema';
import { GoodsReceipt, GoodsReceiptDocument } from 'src/goods-receipt/schemas/goods-receipt.schema';
import { InvoiceReceipt, InvoiceReceiptDocument } from 'src/invoice-receipt/schema/invoice-receipt.schema';
import { SequenceService } from 'src/sequence/sequence.service';
import { ObjectType } from 'src/sequence/enum/en';
import { RecipeService } from 'src/recipe/recipe.service';
import { Restaurant, RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { User, UserDocument } from 'src/users/schemas/users.schema';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(Material.name)
    private readonly materialModelPag: PaginateModel<MaterialDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModelPag: PaginateModel<RestaurantMaterialDocument>,
    @InjectModel(UnitOfMeasure.name)
    private readonly unitOfMeasureModel: Model<UnitOfMeasureDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryHistory.name)
    private readonly inventoryHistoryModel: Model<InventoryHistoryDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    private sequenceService: SequenceService,
    private recipeService: RecipeService,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(req: any, dto: CreateMaterialDto): Promise<MaterialDocument> {
    if (dto.uomBuy && dto.uomBuy != '') {
      const uomBuyData = await this.unitOfMeasureModel.findById(dto.uomBuy);
      dto.name = dto.name + "-" + uomBuyData.name?.replace(" ", "");
      dto.nameAr = dto.nameAr + "-" + uomBuyData.nameAr?.replace(" ", "");
    }
    const sequence = await this.sequenceService.createAndUpdate(ObjectType.Material,
      req.user.supplierId, 'm')
    return await this.materialModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      sequenceNumber: sequence.sequenceValue
    });
  }

  async additionalMaterialDetails(
    req: any,
    dto: RestaurantMaterialDto,
  ): Promise<RestaurantMaterialDocument> {
    return await this.restaurantMaterialModel.findOneAndUpdate(
      {
        restaurantId: dto.restaurantId,
        materialId: dto.materialId,
      },
      {
        ...dto,
        supplierId: req.user.supplierId,
        addedBy: req.user.userId,
      },
      { upsert: true, setDefaultsOnInsert: true, new: true },
    );
  }

  async findRestaurantMaterials(
    req: any,
    query: QueryMaterialDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<RestaurantMaterialDocument>> {
    let queryToApply: any = query;
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    const records = await this.restaurantMaterialModelPag.paginate(
      {
        ...queryToApply,
        supplierId: req.user.supplierId,
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

  async findAll(
    req: any,
    query: QueryMaterialDto,
    paginateOptions: PaginationDto,
  ): Promise<PaginateResult<any>> {
    let queryToApply: any = query;
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter };
    }
    if (req.query.materialIds) {
      queryToApply['_id'] = {
        $in: req.query.materialIds.split(',')
      };
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

    if (req.query.uomBase) {
      let uomBase = req.query.uomBase
      console.log("uomBase", uomBase)
      queryToApply.uomBase = {
        $in: uomBase.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (req.query.addedBy) {
      let addedBy = req.query.addedBy
      queryToApply.addedBy = {
        $in: addedBy.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    if (req.query.materialType) {
      let materialType = req.query.materialType
      queryToApply.materialType = materialType
    }

    if (req.query.procurementType) {
      let procurementType = req.query.procurementType
      queryToApply.procurementType = procurementType
    }

    if (req.query.sequenceNumber) {
      let sequenceNumber = req.query.sequenceNumber
      queryToApply.sequenceNumber = sequenceNumber
    }

    if (req.query.category) {
      let category = req.query.category
      queryToApply.category = {
        $in: category.split(',').map(id => new mongoose.Types.ObjectId(id)),
      };
    }

    console.log("req.query.isModifier", req.query.isModifier);

    if (req.query.isModifier) {
      if (req.query.isModifier?.toString() === 'true') { // Check if it's the string 'true'
        console.log("req.query.isModifier2", req.query.isModifier);
        queryToApply['isModifier'] = true;
      } else {
        queryToApply.$or = [{ isModifier: false }, { isModifier: { $exists: false } }];
      }
    }

    console.log("queryToApply", queryToApply);


    const materials: any = await this.materialModelPag.paginate(
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
        populate: [
          {
            path: 'uomBase',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'menuItemId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'menuAdditionId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'category',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uomSell',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uomBuy',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uomRecipe',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uomInventory',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'uomTransfer',
            populate: {
              path: 'baseUnit',
              select: {
                name: 1,
                nameAr: 1,
                measure: 1,
                baseConversionRate: 1,
                _id: 1,
              },
            },
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'addedBy',
            select: {
              name: 1,
              _id: 1,
            },
          },
        ],
      },
    );

    const materialIds = materials.docs.map(material => material._id);
    const restMatData = await this.restaurantMaterialModel.find({ materialId: { $in: materialIds } });

    materials.docs.forEach(material => {
      const restMat = restMatData.filter((f: any) => f.materialId == material._id?.toString());
      material.restaurantMaterial = restMat || null;
    });
    return materials;
  }

  async findOne(
    materialId: string,
    i18n: I18nContext,
  ): Promise<any> {
    let exists: any = await this.materialModel.findById(materialId).populate([
      {
        path: 'uomBase',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'menuItemId',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'category',
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'uomSell',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'uomBuy',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'uomRecipe',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'uomInventory',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
      {
        path: 'uomTransfer',
        populate: {
          path: 'baseUnit',
          select: {
            name: 1,
            nameAr: 1,
            measure: 1,
            baseConversionRate: 1,
            _id: 1,
          },
        },
        select: {
          name: 1,
          nameAr: 1,
          _id: 1,
        },
      },
    ]);

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    const restMatData = await this.restaurantMaterialModel.find({ materialId: exists._id?.toString() });

    const resp = {
      ...exists.toObject(), // Convert Mongoose document to plain object
      restaurantMaterial: restMatData
    };
    return resp;
  }

  async update(
    req: any,
    materialId: string,
    dto: UpdateMaterialDto,
    i18n: I18nContext,
  ): Promise<MaterialDocument> {

    const material = await this.materialModel.findByIdAndUpdate(
      materialId,
      dto,
      {
        new: true,
      },
    );

    if (!material) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    const getAllRecipes = await this.recipeModel.find({
      'components.materialId': { $in: material._id }
    });
    if (getAllRecipes && getAllRecipes?.length > 0) {
      for (let i = 0; i < getAllRecipes.length; i++) {
        const el: any = getAllRecipes[i];
        const restResp = await this.recipeService.updateRecipePrice(req, el._id);
        el.restaurantRecipePrice = restResp;
        await el.save();
      }
    }


    return material;
  }

  async remove(req: any, materialId: string, i18n: I18nContext): Promise<boolean> {
    const material = await this.materialModel.findByIdAndUpdate(
      materialId,
      { deletedAt: new Date() },
      { new: true },
    );


    if (!material) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    await this.inventoryModel.deleteMany(
      { materialId: materialId, supplierId: req.user.supplierId }
    );

    await this.inventoryHistoryModel.deleteMany(
      { materialId: materialId, supplierId: req.user.supplierId },

    );

    await this.recipeModel.updateMany(
      { "components.materialId": materialId },
      { $pull: { components: { materialId: materialId } } }
    );

    await this.restaurantMaterialModel.deleteMany(
      { materialId: materialId, supplierId: req.user.supplierId }
    );

    return true;
  }


  async excelProcessing(req: any, file: Express.Multer.File) {
    file = file[0];
    const workBook = new Excel.Workbook();
    await workBook.xlsx.readFile(file.path);
    const worksheet = await workBook.getWorksheet(1);
    try {
      let dtoArray = worksheet.getRows(2, worksheet.rowCount).map(row => ({
        materialId: row.getCell(MatUomUpdate.materialId).text,
        uomId: row.getCell(MatUomUpdate.uomId).text
      }));

      dtoArray = dtoArray.filter((f: any) => f.materialId != '' && f.uomId != '');

      const updateOperations = dtoArray.map(({ materialId, uomId }) => ({
        updateOne: {
          filter: {
            supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
            _id: new mongoose.Types.ObjectId(materialId)
          },
          update: { $set: { uomBase: new mongoose.Types.ObjectId(uomId) } }
        }
      }));

      await this.materialModel.bulkWrite(updateOperations);

    } catch (err) {
      console.log("Err", err);
    }
  }

  async addRestaurantMaterialOverride(req: any, materialId: string) {

    console.log("materialId", materialId);
    const allRest = await this.restaurantModel.find({
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
      deletedAt: null
    });
    for (let res = 0; res < allRest.length; res++) {
      const el = allRest[res];

      const checkInv = await this.inventoryModel.find({
        restaurantId: el._id,
        materialId: materialId
      });
      console.log("checkInv", checkInv);
      if (checkInv?.length == 0) {
        const material = await this.materialModel.findById(materialId);
        if (material) {
          await this.inventoryModel.create({
            materialId: materialId,
            restaurantId: el._id,
            stockValue: 0,
            stock: 0,
            averageCost: 0,
            addedBy: req.user.userId,
            supplierId: req.user.supplierId,
            uomBase: material.uomBase,
            uomInventory: material.uomInventory,
          });
        }
      }

      const restaurantMaterial = await this.restaurantMaterialModel.findOne({
        restaurantId: el._id,
        materialId: materialId,
        supplierId: req.user.supplierId,
      });
      if (!restaurantMaterial) {
        await this.restaurantMaterialModel.create({
          restaurantId: el._id,
          materialId: materialId,
          supplierId: req.user.supplierId,
        });
        console.log("materialId done", materialId);
      }



    }



  }
}
