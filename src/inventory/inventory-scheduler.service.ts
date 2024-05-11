import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';

import { Inventory, InventoryDocument } from './schemas/inventory.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, PaginateResult } from 'mongoose';

import { UnitOfMeasureHelperService } from 'src/unit-of-measure/unit-of-measure-helper.service';
import {
  RestaurantMaterial,
  RestaurantMaterialDocument,
} from 'src/material/schemas/restaurant-material.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Restaurant,
  RestaurantDocument,
} from 'src/restaurant/schemas/restaurant.schema';
import {
  Material,
  MaterialDocument,
} from 'src/material/schemas/material.schema';
import { MailService } from 'src/notification/mail/mail.service';
import { GlobalConfigService } from 'src/global-config/global-config.service';
import {
  LOW_INVENTORY_NOTIFICATION_TIME,
  TIMEZONE,
} from 'src/core/Constants/system.constant';
import * as moment from 'moment';
import {
  LowInventory,
  LowInventoryDocument,
} from './schemas/low-inventory.schema';

@Injectable()
export class InventorySchedulerService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(RestaurantMaterial.name)
    private readonly restaurantMaterialModel: Model<RestaurantMaterialDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
    @InjectModel(LowInventory.name)
    private readonly lowInventoryModel: Model<LowInventoryDocument>,
    @Inject(forwardRef(() => UnitOfMeasureHelperService))
    private readonly unitOfMeasureHelperService: UnitOfMeasureHelperService,
    private readonly mailService: MailService,
    private readonly globalConfigService: GlobalConfigService,
  ) { }

  //@Cron(CronExpression.EVERY_30_MINUTES)
  @Cron('0 1 * * *')
  async sendMinimumQuantityNotification() {
    console.log(
      '######### Low Inventory Notification Started at ' + new Date(),
    );

    const inventories = await this.restaurantMaterialModel.aggregate([
      {
        $lookup: {
          from: 'inventories',
          let: {
            restaurantId: '$restaurantId',
            materialId: '$materialId',
            minStockLevel: '$minStockLevel',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$restaurantId', '$$restaurantId'],
                },
              },
            },
            {
              $match: {
                $expr: {
                  $eq: ['$materialId', '$$materialId'],
                },
              },
            },
            {
              $match: {
                $or: [
                  {
                    $expr: {
                      $lte: ['$stock', '$$minStockLevel'],
                    },
                  },
                  {
                    $expr: {
                      $eq: [
                        moment.utc().format('Y-m-d'),
                        {
                          $dateToString: {
                            date: '$expirationDate',
                            format: '%Y-%m-%d',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
          as: 'inventory',
        },
      },
      {
        $match: {
          inventory: {
            $ne: [],
          },
        },
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      {
        $match: {
          'supplier.stockInventoryNotification': true,
        },
      },
    ]);
    // console.log(inventories.length);
    //  console.log("inventories", JSON.stringify(inventories));
    let restaurants = await this.restaurantModel.find({
      _id: {
        $in: inventories.map((i) => {
          return i.restaurantId;
        }),
      },
    });
    restaurants = restaurants.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);

    let materials = await this.materialModel.find({
      _id: {
        $in: inventories.map((i) => {
          return i.materialId;
        }),
      },
    });
    materials = materials.reduce((acc, d) => {
      acc[d._id.toString()] = d;
      return acc;
    }, []);


    const outOfStockMaterials = [];

    for (const inventoryItem of inventories) {
      const restaurantId = inventoryItem.restaurantId.toString();
      const materialId = inventoryItem.materialId?.toString();
      const restaurantInfo = restaurants[restaurantId];
      const materialInfo = materials[materialId];

      if (!outOfStockMaterials[restaurantId]) {
        outOfStockMaterials[restaurantId] = {
          materials: [],
          email: restaurantInfo.email,
          restaurantId,
          supplierId: inventoryItem.supplierId,
        };
      }

      // const lastLowInventory: any = await this.lowInventoryModel.findOne(
      //   { restaurantId },
      //   {},
      //   { sort: { _id: -1 } }
      // );
      // if (lastLowInventory && moment().isBefore(moment(lastLowInventory.createdAt).add(24, 'hours').utc())) {
      //   // Not Due
      //   continue;
      // }
      if (inventoryItem.minStockLevel > 0) {
        try {
          outOfStockMaterials[restaurantId].materials.push({
            materialId,
            materialName: materialInfo?.name,
            materialNameAr: materialInfo?.nameAr,
            onHand: inventoryItem.inventory[0].stock,
            minimumStockLevel: inventoryItem.minStockLevel,
            expirationDate: inventoryItem.inventory[0].expirationDate,
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
    const filteredOutOfStockMaterials = Object.entries(outOfStockMaterials)
      .filter(([key, entry]) => entry.materials.length > 0)
      .reduce((result, [key, entry]) => {
        result[key] = entry;
        return result;
      }, {});


    for (const i in filteredOutOfStockMaterials) {
      let html = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333;" lang="en">Out of Stock Material Notification</h2>
        <p lang="en">Dear Team,</p>
        <p lang="en">We wanted to inform you about the following materials that are currently out of stock:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Material</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">On Hand</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Minimum Stock Level</th>
            </tr>
          </thead>
          <tbody>`;

      for (const j in outOfStockMaterials[i].materials) {
        html += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${outOfStockMaterials[i].materials[j].materialName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${outOfStockMaterials[i].materials[j].onHand}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${outOfStockMaterials[i].materials[j].minimumStockLevel}</td>
            </tr>
      `;
      }

      html += `
          </tbody>
        </table>
        <p lang="en">Please take the necessary actions to replenish the stock for these materials as soon as possible.</p>
       
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
    
        <h2 style="color: #333;" lang="ar">إشعار بنقص المواد</h2>
        <p lang="ar">فريقنا العزيز،</p>
        <p lang="ar">نود أن نبلغكم بأن هناك مواد غير متوفرة حاليًا في المخزون:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">المادة</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">المتوفر حاليًا</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">الحد الأدنى للمستوى</th>
            </tr>
          </thead>
          <tbody>
    `;

      for (const j in outOfStockMaterials[i].materials) {
        html += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${outOfStockMaterials[i].materials[j].materialNameAr}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${outOfStockMaterials[i].materials[j].onHand}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${outOfStockMaterials[i].materials[j].minimumStockLevel}</td>
            </tr>
      `;
      }

      html += `
          </tbody>
        </table>
        <p lang="ar">الرجاء اتخاذ الإجراءات اللازمة لإعادة التعبئة لهذه المواد في أقرب وقت ممكن.</p>
        <p style="margin-top: 15px; color: #999;" lang="en">This email was sent from <span style="color: #ff6600; font-weight: bold;">Talabat Menu</span>.</p>
        </div>
    `;


      let ccEmails = ['joshibhargil@gmail.com', 'almuwallad001@gmail.com'];

      if (outOfStockMaterials[i].email && html) {
        this.mailService.send({
          to: outOfStockMaterials[i].email,
          bcc: ccEmails,
          subject: `Inventory Notification: ${moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss')}`,
          body: html,
        });

        await this.lowInventoryModel.create(outOfStockMaterials[i]);
      }
    }
    this.globalConfigService.create(null, {
      lastLowInventoryNotificationSentAt: new Date(),
    });

    console.log(
      '######### Low Inventory Notification Completed at ' + new Date(),
    );
  }
}
