import { BaseService } from './base.service';
import { Item, CreateItemDto, UpdateItemDto } from '@/types/item.types';

class ItemService extends BaseService<Item, CreateItemDto, UpdateItemDto> {
  constructor() {
    super('/items');
  }

  // item-specific methods if needed
}

export const itemService = new ItemService();
