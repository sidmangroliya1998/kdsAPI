import { PartialType } from '@nestjs/swagger';
import { CreateManualCustomerPaymentDto } from './create-manual-customer-payment.dto';

export class UpdateManualCustomerPaymentDto extends PartialType(CreateManualCustomerPaymentDto) {}
