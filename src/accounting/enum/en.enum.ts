export enum GlVoucherType {
  Manual = 'Manual',
  Expense = 'Expense',
  Sales = 'Sales',
  CustomerPayment = 'Customer Payment',
  Purchase = 'Purchase',
  PriceChange = 'Price Change',
  VendorPayment = 'Vendor Payment',
  ManualJEReversal = 'Manual JE Reversal',
  Refund = 'Refund',
  GoodsReceipt = 'Goods Receipt',
  InvoiceReceipt = 'Invoice Receipt',
  WasteEvent = 'Waste Event',
  StockTransfer = 'Stock Transfer',
  InventoryCount = 'Inventory Count',
  RecipeProduction = 'Recipe Production',
  SalesGoodsIssue = 'Sales Goods Issue',
  RecipeSalesGoodsIssue = 'Recipe Sales Goods Issue',
  ManualVendorInvoice = 'Manual Vendor Invoice',
  ManualVendorPayment = 'Manual Vendor Payment',
  ManualCustomerInvoice = 'Manual Customer Invoice',
  ManualCustomerPayment = 'Manual Customer Payment',
  OpeningBalance = 'Opening Balance',
  SalaryAccural = 'Salary Accural',
  PaymentBankFees = 'Payment Bank Fees',
  MonthlyPayRoll = 'Monthly PayRoll',
  AssetAcquisition = 'Asset Acquisition',
  AssetDepreciation = 'Asset Depreciation',
  AssetRetirement = 'Asset Retirement',
  Recurring = 'Recurring'
}

export enum GlLineType {
  DR = 'DR',
  CR = 'CR',
}

export enum GLTransStatus {
  Draft = 'Draft',
  Approved = 'Approved'
}

export enum GLHistoryActionType {
  AutoEntry = 'Create Entry',
  ManualEntry = 'Create Manual Entry',
  UpdateNotes = 'Update Notes',
  UpdateEntry = 'Update Entry',
  AddNotes = 'Add Notes',
  ManualApproved = 'Manual Approval'
}

export enum IntervalType {
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  yearly = 'Yearly',
  Daily = 'Daily'
}