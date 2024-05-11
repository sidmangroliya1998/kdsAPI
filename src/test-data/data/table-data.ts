import { ListType } from 'src/core/Constants/enum';
import { CreateListDto } from 'src/list/dto/create-list.dto';
import { CreateTableDto } from 'src/table/dto/create-table.dto';

export const tableRegionData: CreateListDto = {
  type: ListType.TableRegion,
  name: 'Default Region',
  nameAr: 'Default Region',
};

export const tableData: CreateTableDto = {
  restaurantId: '',
  tableRegionId: '',
  name: 'Default Table',
  nameAr: 'Default Table',
  totalChairs: 4,
};

export const storageAreaData: CreateListDto = {
  type: ListType.StorageArea,
  name: 'Default Storage',
  nameAr: 'المخزن',
};


export const wasteRegionData: CreateListDto = {
  type: ListType.WasteReason,
  name: 'Spoiled',
  nameAr: 'فاسد- غير قابل للاستخدام',
};