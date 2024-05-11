import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Recipe, RecipeDocument } from './schema/recipe.schema';
import { Model, PaginateModel, PaginateResult } from 'mongoose';
import { QueryRecipeDto } from './dto/query-recipe.dto';
import {
  DefaultSort,
  PaginationDto,
  pagination,
} from 'src/core/Constants/pagination';
import { MongooseQueryParser } from 'mongoose-query-parser';
import { I18nContext } from 'nestjs-i18n';
import {
  Inventory,
  InventoryDocument,
} from 'src/inventory/schemas/inventory.schema';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { RecipePricePreviewDto } from './dto/recipe-price-preview.dto';
import { restaurantId } from '../../test1/constants/test.constant';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import {
  UnitOfMeasure,
  UnitOfMeasureDocument,
} from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { Restaurant, RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import mongoose from 'mongoose';
import { RestaurantMaterial, RestaurantMaterialDocument } from 'src/material/schemas/restaurant-material.schema';

@Injectable()
export class RecipeService {
  constructor(
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModelPag: PaginateModel<RecipeDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(UnitOfMeasure.name)
    private readonly unitOfMeasureModel: Model<UnitOfMeasureDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
  ) { }

  async create(req: any, dto: CreateRecipeDto): Promise<RecipeDocument> {
    let materials = await this.materialModel
      .find({
        _id: {
          $in: dto.components.map((c) => {
            return c.materialId;
          }),
        },
      })
      .populate([
        {
          path: 'uomBase',
          populate: {
            path: 'baseUnit',
            populate: {
              path: 'baseUnit',
            },
          },
        },
      ]);

    let uoms = await this.unitOfMeasureModel
      .find({
        _id: {
          $in: dto.components.map((c) => {
            return c.uom;
          }),
        },
      })
      .populate([
        {
          path: 'baseUnit',
          populate: {
            path: 'baseUnit',
          },
        },
      ]);
    materials = materials.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    uoms = uoms.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);
    for (const i in dto.components) {
      let materialUomMeasure = null;
      let refMaterialUom = materials[dto.components[i].materialId].uomBase;
      while (refMaterialUom) {
        materialUomMeasure = refMaterialUom.measure ?? null;
        if (refMaterialUom.baseUnit) {
          refMaterialUom = refMaterialUom.baseUnit;
        } else {
          refMaterialUom = null;
        }
      }
      let uomMeasure = null;
      let refUom = uoms[dto.components[i].uom];
      while (refUom) {
        uomMeasure = refUom.measure ?? null;
        if (refUom.baseUnit) {
          refUom = refUom.baseUnit;
        } else {
          refUom = null;
        }
      }
      if (materialUomMeasure != uomMeasure) {
        throw new BadRequestException(
          `Material ${dto.components[i].materialId} needs ${materialUomMeasure} type of UOM`,
        );
      }
    }
    const recipe = await this.recipeModel.create({
      ...dto,
      supplierId: req.user.supplierId,
      addedBy: req.user.userId,
      active: true,
    });
    await this.recipeModel.updateMany(
      { masterMaterialId: recipe.masterMaterialId, _id: { $ne: recipe._id } },
      { $set: { active: false } },
    );

    const restResp: any = await this.updateRecipePrice(req, recipe._id);
    recipe.restaurantRecipePrice = restResp;
    await recipe.save();
    return recipe;
  }

  async previewPrice(
    query: RecipePricePreviewDto,
    recipe = null,
  ): Promise<any> {
    if (!recipe)
      recipe = await this.recipeModel.findById(query.recipeId).lean();

    if (!recipe) return { items: [], totalCost: 0 };



    const inventories = await this.inventoryModel.find({
      restaurantId: query.restaurantId,
      materialId: {
        $in: recipe.components?.map((c) => {
          return c.materialId;
        }),
      },
    });

    let totalCost = 0;
    const items = [];
    for (const i in inventories) {
      const component = recipe.components.find((c) => {
        return c.materialId.toString() == inventories[i].materialId.toString();
      });
      if (component) {
        let conversionFactor = 1;
        if (component.uom.toString() != inventories[i].uomBase.toString()) {
          const convert =
            await this.unitOfMeasureHelperService.getConversionFactor(
              component.uom,
              inventories[i].uomBase,
            );
          conversionFactor = convert.conversionFactor;
        }
        let avgCost = inventories[i].averageCost * conversionFactor;

        console.log("avgCost for inventory", avgCost);
        const matAdd = await this.restaurantMaterialModel.findOne({
          restaurantId: query.restaurantId,
          materialId: inventories[i].materialId.toString()
        }).populate([{
          path: 'materialId'
        }]);

        if (matAdd && matAdd?.overridePrice && matAdd?.overridePrice > 0) {
          const convert2 =
            await this.unitOfMeasureHelperService.getConversionFactor(
              matAdd?.materialId?.uomBase?.toString(),
              inventories[i].uomBase?.toString()
            );
          avgCost = convert2.conversionFactor * matAdd?.overridePrice;
        }

        const item = {
          ...component,
          uomBase: inventories[i].uomBase,
          baseUnitCost: avgCost,
          perUnitCost: avgCost,
          baseTotalCost: component.stock * avgCost,
        };
        items.push(item);
        totalCost += item.baseTotalCost;
      }
    }
    return { items, totalCost };
  }

  async findAll(
    req: any,
    query: QueryRecipeDto,
    paginateOptions: PaginationDto
  ): Promise<PaginateResult<RecipeDocument>> {
    let queryToApply: any = query;
    if (query.filter) {
      //delete queryToApply.filter;
      const parser = new MongooseQueryParser();
      const parsed = parser.parse(`${query.filter}`);
      queryToApply = { ...queryToApply, ...parsed.filter }
    }
    if (req.query.materialIds) {
      queryToApply['masterMaterialId'] = {
        $in: req.query.materialIds.split(',')
      };
    }
    let recipes: any = await this.recipeModelPag.paginate(
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
            path: 'supplierId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'masterMaterialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
              materialType: 1,
              procurementType: 1
            },
          },
          {
            path: 'uom',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
            },
          },
          {
            path: 'components.materialId',
            select: {
              name: 1,
              nameAr: 1,
              _id: 1,
              menuItemId: 1
            },
          },
          {
            path: 'components.uom',
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
    const updatedDocs = [];

    for (const doc of recipes.docs) {

      const exists: any = await this.recipeModel.findById(doc._id).lean();

      let components: any = doc.components;

      const priceResponse = await this.previewPrice({
        recipeId: doc._id?.toString(),
        restaurantId: query.restaurantId
      }, exists);
      let updatedComponents = [];
      if (priceResponse) {
        components.forEach((c) => {
          const item = priceResponse.items.find(
            (i) => i.materialId.toString() == c.materialId?._id.toString(),
          );
          if (item) {
            updatedComponents.push({
              ...c,
              uomBase: item.uomBase,
              perUnitCost: item.perUnitCost,
              baseUnitCost: item.baseUnitCost,
              baseTotalCost: item.baseTotalCost
            });
          } else {
            updatedComponents.push({
              ...c,
              uomBase: '',
              perUnitCost: 0,
              baseUnitCost: 0,
              baseTotalCost: 0
            });
            console.log(`No item found for component with materialId: ${c.materialId}`);
          }
        });
      } else {
        components.forEach((c) => {
          c.uomBase = '';
          c.baseUnitCost = 0;
          c.perUnitCost = 0
          c.baseTotalCost = 0;
        });
      }

      if (priceResponse) {
        const updatedDoc = {
          ...doc,
          components: updatedComponents,
          totalCost: priceResponse.totalCost,
        };

        updatedDocs.push(updatedDoc);
      } else {
        const updatedDoc = {
          ...doc,
          totalCost: 0,
        };
        updatedDocs.push(updatedDoc);
      }
    }
    recipes.docs = updatedDocs;

    return recipes;
  }

  async findOne(
    recipeId: string,
    restaurantId: string,
    i18n: I18nContext,
  ): Promise<any> {
    const exists: any = await this.recipeModel.findById(recipeId).lean();

    if (!exists) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }

    const priceResponse = await this.previewPrice(
      { recipeId, restaurantId },
      exists,
    );
    exists.totalCost = 0;
    console.log("priceResponse.items", priceResponse.items);
    if (priceResponse && priceResponse.items.length > 0) {
      exists.components.forEach((c) => {
        const item = priceResponse.items.find(
          (i) => i.materialId.toString() == c.materialId.toString(),
        );
        console.log("item", item);
        if (item) {
          c.uomBase = item.uomBase;
          c.baseUnitCost = item.baseUnitCost;
          c.baseTotalCost = item.baseTotalCost;
        } else {
          console.log(`No item found for component with materialId: ${c.materialId}`);
        }
      });

      exists.totalCost = priceResponse.totalCost;
    } else {
      exists.components.forEach((c) => {
        c.uomBase = '';
        c.baseUnitCost = 0;
        c.baseTotalCost = 0;
      });
    }

    return exists;
  }

  async update(
    req: any,
    recipeId: string,
    dto: UpdateRecipeDto,
    i18n: I18nContext,
  ): Promise<RecipeDocument> {
    const recipe = await this.recipeModel.findByIdAndUpdate(recipeId, dto, {
      new: true,
    });

    if (!recipe) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    const restResp: any = await this.updateRecipePrice(req, recipe._id);

    recipe.restaurantRecipePrice = restResp;
    await recipe.save();
    return recipe;
  }

  async remove(recipeId: string, i18n: I18nContext): Promise<boolean> {
    const recipe = await this.recipeModel.findByIdAndUpdate(
      recipeId,
      { deletedAt: new Date() },
      { new: true },
    );

    if (!recipe) {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
    return true;
  }

  async findRecipe(
    filter: { masterMaterialId: string; supplierId: string; uom: string }
  ): Promise<RecipeDocument> {
    return await this.recipeModel.findOne(filter).lean();
  }

  async updateRecipePrice(req: any, recipeId: string) {

    const allRest = await this.restaurantModel.find({
      supplierId: new mongoose.Types.ObjectId(req.user.supplierId),
      deletedAt: null
    });
    const recipe = await this.recipeModel.findById(recipeId).lean();

    if (!recipe) return { items: [], totalCost: 0 };

    const newComponent = [];
    for (let res = 0; res < allRest.length; res++) {
      const el = allRest[res];
      const inventories = await this.inventoryModel.find({
        restaurantId: el._id,
        materialId: {
          $in: recipe.components?.map((c) => {
            return c.materialId;
          }),
        },
      });

      let totalCost = 0;
      const items = [];
      for (const i in inventories) {
        const component = recipe.components.find((c) => {
          return c.materialId.toString() == inventories[i].materialId.toString();
        });
        if (component) {
          let conversionFactor = 1;
          if (component.uom.toString() != inventories[i].uomBase.toString()) {
            const convert =
              await this.unitOfMeasureHelperService.getConversionFactor(
                component.uom,
                inventories[i].uomBase,
              );
            conversionFactor = convert.conversionFactor;
          }
          const item = {
            ...component,
            uomBase: inventories[i].uomBase,
            baseUnitCost: inventories[i].averageCost,
            baseTotalCost:
              component.stock * conversionFactor * inventories[i].averageCost,

          };
          items.push(item);


          totalCost += item.baseTotalCost;
        }

      }
      newComponent.push(
        {
          totalCost,
          restaurantId: el._id
        }
      )
    }
    return newComponent;
  }

  async updateRecipePriceScript() {

  }
}
