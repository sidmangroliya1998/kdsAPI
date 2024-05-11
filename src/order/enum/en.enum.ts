export enum Source {
  App = 'App',
  Website = 'Website',
  DineIn = 'Dine In',
  MarketPlace = 'MarketPlace',
}

export enum MarketType {
  Hungerstation = 'Hungerstation',
  Toyou = 'Toyou',
  Marsool = 'Marsool',
  Jahez = 'Jahez',
  App = 'App',
  Website = 'Website',
}

export enum MarketPlaceStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum OrderType {
  ToGo = 'To Go',
  Pickup = 'Pickup',
  Delivery = 'Delivery',
  DineIn = 'Dine In',
}

export enum OrderStatus {
  New = 'New',
  SentToKitchen = 'Sent To Kitchen',
  StartedPreparing = 'Started Preparing',
  DonePreparing = 'Done Preparing',
  OnTable = 'On Table',
  Closed = 'Closed',
  Cancelled = 'Cancelled',
  CancelledByMerge = 'Cancelled By Merge',
  CancelledWihPaymentFailed = 'Cancelled Wih Payment Failed',
  Reset = 'Reset',
}

export enum OrderActivityType {
  OrderPlaced = 'OrderPlaced',
  SittingStart = 'SittingStart',
  MenuScanned = 'MenuScanned',
  SentToKitchen = 'SentToKitchen',
  OrderReady = 'OrderReady',
  PaymentReceived = 'PaymentReceived',
  Refunded = 'Refunded',
}

export enum OrderPaymentStatus {
  Pending = 'Pending',
  NotPaid = 'Not Paid',
  Paid = 'Paid',
  OverPaid = 'Over Paid',
  Refunded = 'Refunded',
  PartiallyRefunded = 'Partially Refunded',
  PartiallyPaid = 'Partially Paid',
  Deferred = 'Deferred',
}

export enum InvoiceStatus {
  Invoiced = 'Invoiced',
  Reversed = 'Reversed',
  CreditMemo = 'Credit Memo',
}

export enum PreparationStatus {
  NotStarted = 'Not Started',
  StartedPreparing = 'Started Preparing',
  DonePreparing = 'Done Preparing',
  OnTable = 'On Table',
}

export enum DeliveryStatus {
  New = 'New',
  Started = 'Started',
  Delivered = 'Delivered',
  Failed = 'Failed',
}

export enum OrderActionTypeHistory {
  Created = 'Created',
  Cancelled = 'Cancelled',
  MoveTable = 'MoveTable',
  MergeTable = 'MergeTable',
  Deferred = 'Deferred',
  PaymentCollected = 'PaymentCollected',
  ChangeOrder = 'ChangeOrder',
  ApplyDiscount = 'ApplyDiscount',
  Reset = 'Reset',
  MoveItems = 'MoveItems'
}