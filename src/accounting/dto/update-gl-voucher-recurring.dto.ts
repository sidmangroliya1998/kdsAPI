import { PartialType } from '@nestjs/swagger';
import { CreateGlVoucherRecurringDto } from './create-gl-voucher-recurring.dto';

export class UpdateGlVoucherRecurringDto extends PartialType(CreateGlVoucherRecurringDto) {}
