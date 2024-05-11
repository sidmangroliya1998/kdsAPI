import { PrinterType } from 'src/printer/enum/en';

export const printers = [
  {
    name: 'Cashier Printer',
    nameAr: 'Cashier Printer',
    printerLabel: 'p1',
    type: PrinterType.Cashier,
    printerSetup: 1,
    isDefault: true,
  },
  {
    name: 'Kitchen Printer',
    nameAr: 'Kitchen Printer',
    printerLabel: 'p2',
    type: PrinterType.Kitchen,
    printerSetup: 1,
    isDefault: true,
  },
];
