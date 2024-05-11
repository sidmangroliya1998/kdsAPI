import { CreatePaymentSetupDto } from 'src/payment-setup/dto/create-payment-setup.dto';

export const PaymentSetupData: CreatePaymentSetupDto = {
  inStore: {
    ePayment: true,
    cashPayment: true,
    rewardsClaim: true,
    pos: true,
  },
  delivery: {
    ePayment: true,
    cashPayment: true,
    rewardsClaim: true,
    pos: true,
  },
  pickup: {
    ePayment: true,
    cashPayment: true,
    rewardsClaim: true,
    pos: true,
  },
};
