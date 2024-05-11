import { PartialType } from '@nestjs/swagger';
import { CreateEmpHourlyTimeSheetDto } from './create-emp-hourly-timesheet.dto';
export class UpdateEmpHourlyTimeSheetDto extends PartialType(CreateEmpHourlyTimeSheetDto) { }
