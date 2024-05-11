import { PartialType } from '@nestjs/swagger';
import { CreateManualCustomerInvoiceDto } from './create-manual-customer-invoice.dto';

export class UpdateManualCustomerInvoiceDto extends PartialType(CreateManualCustomerInvoiceDto) {}
