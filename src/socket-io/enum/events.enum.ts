export enum SocketEvents {
  TableDashboard = 'Table:Dashboard',
  TableLog = 'Table:Log',
  CashierDashboard = 'Cashier:Dashboard',
  Cashier = 'Cashier',
  KitchenQueueDashboard = 'KitchenQueue:Dashboard',
  KitchenQueue = 'KitchenQueue',
  ping = 'ping',
  auth = 'auth',
  OrderCreated = 'Order:Created',
  OrderPrepared = 'Order:Prepared',
  PosTransaction = 'Pos:Transaction',
  PosLaunched = 'Pos:Launched',
  print = 'print',
  Invoice = 'Invoice',
  NoKitchenPrinterFound = 'NoKitchenPrinter',
  NoCashierPrinterFound = 'NoCashierPrinter'
}
