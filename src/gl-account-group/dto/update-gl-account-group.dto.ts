import { PartialType } from '@nestjs/swagger';
import { CreateGlAccountGroupDto } from './create-gl-account-group.dto';

export class UpdateGlAccountGroupDto extends PartialType(CreateGlAccountGroupDto) {}
