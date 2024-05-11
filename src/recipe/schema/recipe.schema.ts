import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';
import { RecipeMaterial, RecipeMaterialSchema } from './recipe-material.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import * as paginate from 'mongoose-paginate-v2';

import { RecipeType } from '../enum/en';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';

export type RecipeDocument = Recipe & Document;


@Schema({})
export class RestaurantRecipePrice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
    required: true,
  })
  restaurantId: RestaurantDocument;

  @Prop({ required: true })
  totalCost: number;
}

export const RestaurantRecipePriceSchema =
  SchemaFactory.createForClass(RestaurantRecipePrice);


@Schema({ timestamps: true })
export class Recipe {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Material',
    index: true,
    default: null,
  })
  masterMaterialId: MaterialDocument;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    required: true,
  })
  uom: UnitOfMeasureDocument;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  nameAr: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  descriptionAr: string;

  @Prop({ type: String, enum: RecipeType })
  type: RecipeType;

  @Prop({ type: [RecipeMaterialSchema], default: [] })
  components: RecipeMaterial[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({})
  active: boolean;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ default: 0 })
  totalCost: number;
  
  @Prop({ type: [RestaurantRecipePriceSchema], default: [], required: false })
  restaurantRecipePrice: RestaurantRecipePrice[];
}


export const RecipeSchema = SchemaFactory.createForClass(Recipe);
RecipeSchema.plugin(paginate);
