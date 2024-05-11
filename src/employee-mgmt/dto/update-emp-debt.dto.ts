import { PartialType } from '@nestjs/swagger';
import { CreateDebtEmpDto } from './create-emp-debt.dto';


export class UpdateEmpDebtDto extends PartialType(CreateDebtEmpDto) { }
