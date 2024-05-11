import { PartialType } from '@nestjs/swagger';
import { CreateManualVendorInvoiceDto } from './create-manual-vendor-invoice.dto';

export class UpdateManualVendorInvoiceDto extends PartialType(CreateManualVendorInvoiceDto) {}
