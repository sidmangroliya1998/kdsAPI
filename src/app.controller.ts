import { Controller, Get, Post, Req, Res, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './core/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('success')
  async payment_success_handler(@Req() req, @Res() res, @Body() body) {
    // console.log(req.headers);
    // console.log("FormData log", req.body)
    // console.log("FormData log cartId", req.body?.cartId)
    // console.log("FormData log respCode", req.body?.respCode)
    // console.log("@Body", body)
    // console.log("@req", req?.query?.orderId)
    // console.log("@req", req?.query?.domain)

    //   acquirerMessage: '',
    // acquirerRRN: '',
    // cartId: '6617f7edf8792472e3ddfd29',
    // customerEmail: 'sada@zsda.com',
    // respCode: 'G46869',
    // respMessage: 'Authorised',
    // respStatus: 'A',
    // signature: '8f2205f2bb81ccde12f2ab8b890934bbbc0002563f17c8289ed1b05a751e6e4b',
    // token: '',
    // tranRef: 'TST2410200122431'
    this.appService.handle_clickPay_success(req, res, req?.body?.respStatus == 'A');
  }
}
