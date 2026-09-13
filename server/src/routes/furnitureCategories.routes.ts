import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const furnitureCategoriesRouter = createCrudRouter({
  delegate: prisma.furnitureCategory,
  permissionModule: 'products',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
