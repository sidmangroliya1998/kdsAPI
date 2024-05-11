import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateExpenseDto } from 'src/expense/dto/create-expense.dto';
import { CreatePurchaseLineItemDto } from './create-purchase-line-item.dto';
import { IsArray, IsNotEmpty, ValidateNested,IsOptional,IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseDto extends OmitType(CreateExpenseDto, [
  'items',
] as const) {
  @ApiProperty({ type: [CreatePurchaseLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseLineItemDto)
  @IsNotEmpty()
  items: CreatePurchaseLineItemDto[];

 
}
