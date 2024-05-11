import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { catchError, lastValueFrom, map } from 'rxjs';
import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async sendMessage(
    supplierId: string,
    phoneNumber: string,
    message: string,
    media: string = null,
  ): Promise<boolean> {
    console.log('Whatsapp', {
      sessionId: supplierId,
      phoneNumber,
      message,
      media,
    });
    const response = await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get(
            'app.whatsappBaseUrl',
          )}/whatsapp/send-message`,
          {
            sessionId: supplierId,
            phoneNumber,
            message,
            media,
          },
        )
        .pipe(map((resp) => resp.data))
        .pipe(
          catchError((e) => {
            throw new BadRequestException(e);
          }),
        ),
    );
    console.log('Whatsapp', response);
    if (response && response.data) return true;
    return false;
  }

  async sendOldMessage(
    type: string,
    phoneNumber: string,
    message: string,
  ): Promise<boolean> {
    const response = await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get(
            'app.whatsappBaseUrl',
          )}/whatsapp/send-message`,
          {
            type,
            phoneNumber,
            message,
          },
        )
        .pipe(map((resp) => resp.data))
        .pipe(
          catchError((e) => {
            throw new BadRequestException(e);
          }),
        ),
    );
    console.log('Whatsapp', response);
    if (response && response.data) return true;
    return false;
  }

  async checkStatus(sessionId: string) {
    const response = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get(
            'app.whatsappBaseUrl',
          )}/whatsapp/check-status?sessionId=${sessionId}`,
        )
        .pipe(map((resp) => resp.data))
        .pipe(
          catchError((e) => {
            throw new BadRequestException(e);
          }),
        ),
    );
    console.log('Whatsapp', response);
    if (response && response.data == true) return true;
    return false;
  }

  async connect(sessionId: string) {
    const response = await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get('app.whatsappBaseUrl')}/whatsapp/connect`,
          {
            sessionId,
            isAuto: true,
          },
        )
        .pipe(map((resp) => resp.data))
        .pipe(
          catchError((e) => {
            throw new BadRequestException(e);
          }),
        ),
    );
    console.log('Whatsapp', response);
    if (response && response.data == true) return true;
    return false;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkWhatsAppCron() {
    console.log(
      '#####################Check Whatsapp Cron Started #######################',
    );
    const suppliers = await this.supplierModel.find({
      iswhatsappOpted: true,
    });
    console.log(
      `#####################Found ${suppliers.length} Suppliers to process ##################`,
    );
    for (const i in suppliers) {
      const res = await this.checkStatus(suppliers[i]._id.toString());
      console.log(
        `#####################Supplier Whatsapp Connection ${suppliers[i]._id} - ${res} ##################`,
      );
      if (res) {
        if (!suppliers[i].iswhatsappConnected) {
          suppliers[i].lastWhatsappConnectionTime = new Date();
        }
        suppliers[i].iswhatsappConnected = true;
        suppliers[i].isAutowhatsappAttempted = false;
      } else {
        if (suppliers[i].isAutowhatsappAttempted == false) {
          console.log(
            `#####################Supplier Auto connect called ${suppliers[i]._id} ##################`,
          );
          this.connect(suppliers[i]._id.toString());
          suppliers[i].isAutowhatsappAttempted = true;
        } else {
          console.log(
            `#####################Supplier Whatsapp Disconnected - ${suppliers[i]._id} ##################`,
          );
          suppliers[i].iswhatsappConnected = false;

          suppliers[i].lastWhatsappDisconnectionTime = new Date();
        }
      }
      suppliers[i].save();
    }
    console.log(
      '#####################Check Whatsapp Cron Completed ##################',
    );
  }
}
