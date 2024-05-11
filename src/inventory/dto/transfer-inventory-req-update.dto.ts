import { PartialType } from '@nestjs/swagger';
import { TransferInventoryReqItemDto, TransferInventoryRequestDto } from './transfer-inventory-req.dto';

export class UpdateTransferInventoryReqDto extends PartialType(TransferInventoryRequestDto) {}
