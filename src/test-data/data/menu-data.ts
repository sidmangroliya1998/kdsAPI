import { CreateMenuCategoryDTO } from 'src/menu/dto/menu-category.dto';
import { CreateMenuItemDTO } from 'src/menu/dto/menu-item.dto';

export const MenuCategoryData: CreateMenuCategoryDTO = {
  name: 'Default Category',
  nameAr: 'Default Category',
  order: 1,
};

export const MenuItemData: CreateMenuItemDTO = {
  categoryId: '',
  name: 'Default Menu Item',
  nameAr: 'Default Menu Item',
  price: 10,
  calories: 10,
  order: 1,
  preparationTime: 10,
};
