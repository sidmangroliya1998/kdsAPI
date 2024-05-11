import { PartialType } from '@nestjs/swagger';
import { CreateWasteEventNewDto } from './create-waste-event-new.dto';

export class UpdateWasteEventNewDto extends PartialType(CreateWasteEventNewDto) {}
