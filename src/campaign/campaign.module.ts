import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignSchedulerService } from './campaign-scheduler.service';
import { Customer, CustomerSchema } from 'src/customer/schemas/customer.schema';
import { HttpCallerModule } from 'src/core/Providers/http-caller/http-caller.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    HttpCallerModule,
  ],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignSchedulerService],
})
export class CampaignModule {}
