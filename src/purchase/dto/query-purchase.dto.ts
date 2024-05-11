import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ToBoolean } from 'src/core/Helpers/custom.validators';

export class QueryPurchaseDto {
  @ApiProperty({ required: false, example: false })
  @ToBoolean()
  @IsOptional()
  trasferredToGl: boolean;
}
