import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  handle_clickPay_success(req, res, isSuccess) {
    console.log("handle_clickPay_success_called");
    let finalURL = (req && req.query && req.query.domain ? req.query.domain : "") + (isSuccess ? "/order/success" : "/order/failed") + "?orderId=" + (req && req.query && req.query.orderId ? req.query.orderId : "");
    if (req && req.query && req.query.tableId && req.query.restaurantId) {
      finalURL += "&tableId=" + req.query.tableId + "&restaurantId=" + req.query.restaurantId;
    }

    return res.redirect(301, finalURL);
  }

}
