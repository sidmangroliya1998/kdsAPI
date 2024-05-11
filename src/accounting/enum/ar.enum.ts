export enum GlVoucherType {
  Manual = "يدوي",
  Expense = "مصروفات",
  Sales = "مبيعات",
  CustomerPayment = "مدفوعات العميل",
  Purchase = "شراء",
  PriceChange = "تغيير السعر",
  VendorPayment = "مدفوعات مورد",
  ManualJEReversal = "عكس القيد اليدوي",
  Refund = "استرداد",
  GoodsReceipt = "استلام البضائع",
  InvoiceReceipt = "استلام الفاتورة",
  WasteEvent = "تسجيل الهدر",
  StockTransfer = "تحويل المخزون",
  InventoryCount = "جرد المخزون",
  RecipeProduction = "إنتاج الوصفة",
  SalesGoodsIssue = "إصدار بضائع المبيعات",
  RecipeSalesGoodsIssue = "إصدار بضائع الخام المبيعات",
  ManualVendorInvoice = "فاتورة البائع اليدوية",
  ManualVendorPayment = "دفعة البائع اليدوية",
  ManualCustomerInvoice = "فاتورة العميل اليدوية",
  ManualCustomerPayment = "دفعة العميل اليدوية",
  OpeningBalance = 'أرصدة افتتاحية',
  SalaryAccural = 'مصاريف مستحقة',
  PaymentBankFees = 'رسوم البنك للدفع',
  MonthlyPayRoll = 'دفع شهري للموظفين'

}
export enum GLTransStatus {
  Draft = 'Draft',
  Approved = 'Approved'
}
export enum GLHistoryType {
  AutoEntry = 'Create Entry',
  ManualEntry = 'Create Manual Entry',
  UpdateNotes = 'Update Notes',
  UpdateEntry = 'Update Entry'
}