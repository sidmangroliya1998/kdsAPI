import { PartialType } from '@nestjs/swagger';
import { CreateGlAccountMappingDto } from './create-gl-account-mapping.dto';

export class UpdateGlAccountMappingDto extends PartialType(CreateGlAccountMappingDto) {}
