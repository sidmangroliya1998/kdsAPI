import { CalculationType } from 'src/core/Constants/enum';
import { CreateOfferDto } from 'src/offer/dto/create-offer.dto';
import { ApplicationType, OfferType } from 'src/offer/enum/en.enum';

export const OfferData: CreateOfferDto = {
  name: 'StoreManager',
  nameAr: 'StoreManager',
  start: new Date('2023-07-11T00:00:00.000Z'),
  end: new Date('2099-07-11T00:00:00.000Z'),
  code: 'StoreManager',
  offerType: OfferType.Coupon,
  applicationType: ApplicationType.Header,
  discountType: CalculationType.Fixed,
  discount: 10,
  maxDiscount: 0,
  maxNumberAllowed: 0,

  showName: true,
};
