import { PartialType } from '@nestjs/swagger';
import { CreateEmpMealDto } from './create-emp-meal.dto';

export class UpdateEmpMealDto extends PartialType(CreateEmpMealDto) { }
