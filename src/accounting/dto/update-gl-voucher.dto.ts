import { PartialType } from '@nestjs/swagger';
import { CreateGlVoucherDto } from './create-gl-voucher.dto';

export class UpdateGlVoucherDto extends PartialType(CreateGlVoucherDto) {}
