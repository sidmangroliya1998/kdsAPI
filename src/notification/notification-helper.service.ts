import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

import {
  Supplier,
  SupplierDocument,
} from 'src/supplier/schemas/suppliers.schema';
import { NotificationType, OrderEvents } from './enum/en.enum';
import { getHBVars, replaceAll } from 'src/core/Helpers/universal.helper';
import { MailService } from './mail/mail.service';

@Injectable()
export class NotificationHelperService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    private readonly mailService: MailService,
  ) {}

  async triggerNotification(
    supplierId: string,
    event: OrderEvents | string,
    data: any = {},
  ) {
    const notifications = await this.notificationModel.find({
      supplierId,
      events: event,
    });

    console.log(event, 'Notifications', notifications);
    for (const i in notifications) {
      const { content, subject } = await this.prepareMessage(
        notifications[i],
        data,
      );
      console.log(content);
      const recipient = data.recipients ?? [];

      for (const j in notifications[i].channels) {
        switch (notifications[i].channels[j]) {
          case NotificationType.Email:
            this.triggerEmailNotification(
              notifications[i],
              recipient.concat(notifications[i].customRecipients),
              content,
              subject,
              data.attachments ?? [],
            );
            break;
        }
      }
    }
  }

  async triggerEmailNotification(
    notification: NotificationDocument,
    recipients: string[],
    content: string,
    subject: string,
    attachments = [],
  ) {
    content = content.replace('\n', '<br>');

    for (const i in recipients) {
      await this.mailService.send({
        to: recipients[i],
        subject,
        body: content,
        attachments: attachments,
      });
    }
  }

  async prepareMessage(notification: NotificationDocument, data: any) {
    const wordsToReplace = {
      '{{RestaurantName}}': data['RestaurantName'] ?? '',
      '{{RestaurantPhoneNumber}}': data['RestaurantPhoneNumber'] ?? '',
      '{{RestaurantWhatsappNumber}}': data['RestaurantWhatsappNumber'] ?? '',
      '{{RestaurantEmail}}': data['RestaurantEmail'] ?? '',
    };
    const placeholders = getHBVars(notification.content);

    return {
      content: replaceAll(notification.content, wordsToReplace),
      subject: replaceAll(notification.subject, wordsToReplace),
    };
  }
}
