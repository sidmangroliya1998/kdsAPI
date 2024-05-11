import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ProductionEvent,
  ProductionEventDocument,
} from './schema/production-event.schema';
import { Model } from 'mongoose';
import { InventoryHelperService } from '../inventory/inventory-helper.service';
import { Recipe, RecipeDocument } from 'src/recipe/schema/recipe.schema';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { CreateProductionEventDto } from './dto/create-production-event.dto';
import { Inventory, InventoryDocument } from 'src/inventory/schemas/inventory.schema';
import { RecipeService } from 'src/recipe/recipe.service';
import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import { I18nContext } from 'nestjs-i18n';
import { ProductionEventNewDocument } from './schema/production-event-new.schema';
import { CreateProductionEventNewDto } from './dto/create-production-event-new.dto';

@Injectable()
export class ProductionEventHelperService {
  constructor(
    @InjectModel(ProductionEvent.name)
    private readonly productionEventModel: Model<ProductionEventDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    private readonly inventoryHelperService: InventoryHelperService,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly recipeService: RecipeService,
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService
  ) { }


  async executeRecipeNew(
    productionEvent: ProductionEventNewDocument,
    dto: CreateProductionEventNewDto,
  ) {
   
    let preparedData = [];
    for (let i = 0; i < productionEvent.items.length; i++) {
      const recipe = await this.recipeModel
        .findOne({
          masterMaterialId: productionEvent.items[i].materialId,
        })
        .populate([
          {
            path: 'masterMaterialId',
          },
        ]);
      // console.log("recipe", recipe);
      if (recipe) {
        const preparedItemData =
          await this.inventoryHelperService.handleSemiFinishedMaterialPostSale(
            recipe.masterMaterialId,
            recipe,
            {
              restaurantId: dto.restaurantId,
              quantitiesSold: productionEvent.items[i].quantity,
              uom: productionEvent.items[i].uom?.toString(),
              entity: productionEvent,
            },
            true,
          );

        // console.log("Production event preparedItemData", preparedItemData);
        productionEvent.items[i].cost = preparedItemData.totalCost;
        await productionEvent.save();
        preparedData.push({ material: recipe.masterMaterialId, itemData: preparedItemData });
      } else {
        throw new BadRequestException(`No Recipe found`);
      }

    }
    return preparedData;
  };

  async executeRecipe(
    productionEvent: ProductionEventDocument,
    dto: CreateProductionEventDto,
  ) {
    const recipe = await this.recipeModel
      .findOne({
        masterMaterialId: dto.materialId,
      })
      .populate([
        {
          path: 'masterMaterialId',
        },
      ]);

    if (recipe) {
      const preparedData =
        await this.inventoryHelperService.handleSemiFinishedMaterialPostSale(
          recipe.masterMaterialId,
          recipe,
          {
            restaurantId: dto.restaurantId,
            quantitiesSold: dto.quantity,
            uom: dto.uom,
            entity: productionEvent,
          },
          true,
        );
      return preparedData;
    }
    throw new BadRequestException(`No Recipe found`);
  };

  async validateStockAvailable(req: any, dto: CreateProductionEventDto, i18n: I18nContext): Promise<Boolean> {
    const findRecipe = await this.recipeService.findRecipe({
      masterMaterialId: dto?.materialId,
      supplierId: req.user.supplierId,
      uom: dto?.uom
    });

    if (findRecipe == null) {
      throw new NotFoundException(i18n.t('Receipe not found'));
    }

    const inventories = await this.inventoryModel.find({
      restaurantId: dto?.restaurantId,
      materialId: {
        $in: findRecipe.components?.map((c) => {
          return c.materialId;
        }),
      },

    });

    const items = [];
    if (inventories) {
      for (const i in inventories) {
        // if (inventories[i].averageCost <= 0) {
        //   throw new NotFoundException(i18n.t('Component Average price is 0'));
        // }
        const component = findRecipe.components.find((c) => {
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

          if (inventories[i].stock > (component.stock * conversionFactor)) {
            items.push(inventories[i]);
          }
        }
      }

      return items.length === inventories.length
    } else {
      throw new NotFoundException(i18n.t('error.NOT_FOUND'));
    }
  }
}
