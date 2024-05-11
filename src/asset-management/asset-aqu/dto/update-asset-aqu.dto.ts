import { PartialType } from '@nestjs/swagger';
import { CreateAssetAquDto } from './create-asset-aqu.dto';

export class UpdateAssetAquDto extends PartialType(CreateAssetAquDto) { }
