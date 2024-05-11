import { PartialType } from '@nestjs/swagger';
import { CreateGlAccountSetDto } from './create-gl-account-set.dto';

export class UpdateGlAccountSetDto extends PartialType(CreateGlAccountSetDto) {}
