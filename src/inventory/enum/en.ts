export enum InventoryAction {
  GoodsReceipt = 'Goods Receipt',
  ItemSold = 'Item Sold',
  ComponentsItemSold = 'Components Item Sold',
  ProductionEvent = 'Production Event',
  WasteEvent = 'Waste Event',
  InventoryCount = 'Inventory Count',
  ManualCount = 'Manual Count',
  ReceivedWithTransfer = 'Received With Transfer',
  SentWithTransfer = 'Sent With Transfer',
  PriceChange = 'Price Change',
}
export enum InventoryDirection {
  Positive = 'Positive',
  Negataive = 'Negative',
}
export enum TransferRequestStatus {
  New = 'New',
  Available = 'Available',
  NotAvailable = 'Not Available',
  Accept = 'Accept',
  Reject = 'Reject',
  Sent = 'Sent',
  Closed = 'Closed'
}