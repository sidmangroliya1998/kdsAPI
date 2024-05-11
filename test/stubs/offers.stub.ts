import { CalculationType } from 'src/core/Constants/enum';
import { ApplicationType, OfferType } from 'src/offer/enum/en.enum';

export const offers = [
  {
    name: '10% Off',
    nameAr: '10% Off',
    start: new Date(2023, 1, 1),
    end: new Date(2023, 12, 31),
    code: null,
    offerType: OfferType.Promotion,
    discountType: CalculationType.Percentage,
    discount: 10,
    maxDiscount: 50,
    maxNumberUsed: null,
    startTime: null,
    endTime: null,
    showName: true,
    priority: 1,
    menuItemIds: [],
    menuCategoryIds: [],
    active: true,
    applicationType: ApplicationType.LineItem,
    maxNumberAllowed: 1,
  },
];
