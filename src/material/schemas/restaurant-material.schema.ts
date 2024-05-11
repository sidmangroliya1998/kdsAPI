import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId } from 'mongoose';

import * as paginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
import { SupplierDocument } from 'src/supplier/schemas/suppliers.schema';
import { MaterialType, UnitOfMeasure, ProcurementType } from '../enum/en';
import { ListDocument } from 'src/list/schemas/list.schema';
import { MenuItemDocument } from 'src/menu/schemas/menu-item.schema';
import { UserDocument } from 'src/users/schemas/users.schema';
import { UnitOfMeasureDocument } from 'src/unit-of-measure/schemas/unit-of-measure.schema';
import { MaterialDocument } from './material.schema';
import { RestaurantDocument } from 'src/restaurant/schemas/restaurant.schema';
import { VendorDocument } from 'src/vendor/schemas/vendor.schema';

export type RestaurantMaterialDocument = RestaurantMaterial & Document;

@Schema({ timestamps: true })
export class RestaurantMaterial {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    index: true,
    required: true,
  })
  supplierId: SupplierDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Restaurant',
    index: true,
    required: true,
  })
  restaurantId: RestaurantDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Material',
    index: true,
    required: true,
  })
  materialId: MaterialDocument;

  @Prop({ default: 0 })
  minStockLevel: number;

  @Prop({ default: 0 })
  parLevel: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User',
  })
  addedBy: UserDocument;

  @Prop({ default: 0 })
  overridePrice: number;

  @Prop({ default: false })
  isForSale: boolean;

  @Prop({ default: false })
  isForDailyCount: boolean;

  @Prop({ default: 0 })
  maxStockLevel: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'UnitOfMeasure',
    default: null,
  })
  maxLevelUoM: UnitOfMeasureDocument;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    index: true,
    ref: 'Vendor',
    default: [],
  })
  allowedVendors: VendorDocument[];

  @Prop({ default: 0 })
  maxCeilingPrice: number;
}

export const RestaurantMaterialSchema =
  SchemaFactory.createForClass(RestaurantMaterial);

RestaurantMaterialSchema.plugin(paginate);
RestaurantMaterialSchema.plugin(mongooseAggregatePaginate);
