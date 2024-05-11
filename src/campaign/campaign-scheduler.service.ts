import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { Model } from 'mongoose';

import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import {
  Customer,
  CustomerDocument,
} from 'src/customer/schemas/customer.schema';
import { WhatsappService } from 'src/core/Providers/http-caller/whatsapp.service';

@Injectable()
export class CampaignSchedulerService {
  processingSuppliers = [];
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly whatsappService: WhatsappService,
  ) {}
  @Cron(CronExpression.EVERY_10_MINUTES)
  async processCampaign() {
    console.log(
      '#####################Process Campaign Cron Started ##################',
    );
    const queryCondition = {
      deletedAt: null,
      processedAt: null,
      status: 0,
      scheduledAt: {
        $lte: new Date(),
      },
    };
    console.log(`Campaign Query Condition `, queryCondition);
    const campaigns = await this.campaignModel
      .find(queryCondition)
      .populate([{ path: 'supplierId' }]);
    console.log(
      `################ Found Campaigns ${campaigns.length} ########################`,
    );
    for (const i in campaigns) {
      if (campaigns[i].supplierId.iswhatsappConnected)
        this.executeCampaign(campaigns[i]);
    }
    console.log(
      '#####################Process Campaign Cron Completed ##################',
    );
  }

  async executeCampaign(campaign: CampaignDocument) {
    if (this.processingSuppliers.includes(campaign.supplierId._id.toString()))
      return;
    this.processingSuppliers.push(campaign.supplierId._id.toString());
    campaign.status = 1;
    campaign.save();
    let phoneNumbers = campaign.phoneNumbers;
    if (!phoneNumbers) {
      const customers = await this.customerModel.find({
        supplierId: campaign.supplierId._id,
      });
      phoneNumbers = customers.map((c) => c.phoneNumber);
    }
    let counter = 0,
      failed = 0,
      successfull = 0;
    for (const i in phoneNumbers) {
      // const randomDelay = 2 * 1000;
      // setTimeout(async () => {

      //   counter += 1;
      // }, randomDelay);
      try {
        const response = await this.whatsappService.sendMessage(
          campaign.supplierId._id.toString(),
          phoneNumbers[i],
          campaign.message,
          campaign.media,
        );
        if (response) successfull++;
        else failed++;
        if (counter == 20) {
          counter = 0;
          await this.sleep(20000);
        } else {
          const randomeDelay = Math.floor(Math.random() * (6 - 2 + 1) + 2);
          await this.sleep(randomeDelay * 1000);
        }
      } catch (err) {
        console.error(
          '##################Campaign Process Error#################',
          err,
        );
        failed++;
      }

      counter++;
    }
    campaign.status = 2;
    campaign.processedRecords = counter;
    campaign.failedRecords = failed;
    campaign.successfullRecords = successfull;
    campaign.processedAt = new Date();
    campaign.save();
    const index = this.processingSuppliers.indexOf(
      campaign.supplierId._id.toString(),
    );
    if (index !== -1) {
      this.processingSuppliers.splice(index, 1);
    }
    console.log(
      '##################Campaign processed#################',
      campaign.toObject(),
    );
  }

  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
