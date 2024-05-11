import { PartialType } from '@nestjs/swagger';
import { CreateEmpDto } from './create-emp.dto';

export class UpdateEmpDto extends PartialType(CreateEmpDto) { }
