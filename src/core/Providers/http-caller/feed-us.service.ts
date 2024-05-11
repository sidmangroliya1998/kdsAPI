import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { MarketPlaceStatus } from 'src/order/enum/en.enum';
import { OrderDocument } from 'src/order/schemas/order.schema';

@Injectable()
export class FeedUsService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async updateOrderStatus(order: OrderDocument): Promise<boolean> {
    const response = await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get(
            'feedus.API_BASE_URL',
          )}/api/v1/pos-update-order`,
          {
            order_id: order.feedusId,
            status:
              order.marketPlaceStatus == MarketPlaceStatus.Accepted
                ? 'accepted'
                : 'rejected',
            reason: order.marketPlaceReason,
          },
        )
        .pipe(map((resp) => resp.data))
        .pipe(
          catchError((e) => {
            throw new BadRequestException(e);
          }),
        ),
    );
    console.log('Feedus', response);
    if (response && response.data) return true;
    return false;
  }
}
