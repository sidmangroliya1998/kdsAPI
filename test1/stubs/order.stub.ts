import { CreateOrderDto } from 'src/order/dto/create-order.dto';
import { OrderType, Source } from 'src/order/enum/en.enum';
import {
  menuAdditionId,
  menuItem1Id,
  menuItem2Id,
  optionId,
  restaurantId,
  tableId,
} from 'test1/constants/test.constant';

export const OrderCreateWithoutAdditionStub = (): CreateOrderDto => {
  return {
    restaurantId: restaurantId,
    tableId: tableId,
    name: 'Nur',
    contactNumber: '9415465',
    source: Source.DineIn,
    orderType: OrderType.DineIn,
    items: [
      {
        menuItem: {
          menuItemId: menuItem2Id,
        },
        quantity: 1,
        additions: [],
        notes: '',
      },
    ],
  };
};

export const OrderCreateWithAdditionStub = (): CreateOrderDto => {
  return {
    restaurantId: restaurantId,
    tableId: tableId,
    name: 'Nur',
    contactNumber: '9415465',
    source: Source.DineIn,
    orderType: OrderType.DineIn,
    items: [
      {
        menuItem: {
          menuItemId: menuItem1Id,
        },
        additions: [
          {
            menuAdditionId: menuAdditionId,
            options: [
              {
                optionId: optionId,
                quantity: 1,
                perItemQuantity:1
              },
            ],
          },
        ],
        quantity: 5,
        notes: 'creamy shake',
      },
    ],
  };
};
