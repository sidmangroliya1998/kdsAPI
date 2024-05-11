import { PartialType } from '@nestjs/swagger';
import { CreateManualVendorPaymentDto } from './create-manual-vendor-payment.dto';

export class UpdateManualVendorPaymentDto extends PartialType(CreateManualVendorPaymentDto) {}
