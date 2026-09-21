import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const furnitureRouter = Router();

function toBool(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true' || value === '1' || value === true;
}

// Public detail page (src/pages/FurnitureDetails.tsx) — only ever exposes active
// furniture; inactive rows 404 on the public site even if their slug is known.
// Everything the page needs (products it's used in, its "applies to" categories,
// and same-category related furniture) is resolved here in a small, fixed number
// of queries so the page never has to make follow-up requests.
furnitureRouter.get(
  '/public/:slug',
  asyncHandler(async (req, res) => {
    const item = await prisma.furniture.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        productLinks: {
          include: { product: { select: { id: true, nameUz: true, nameRu: true, slug: true, images: true, price: true, originalPrice: true } } },
        },
      },
    });
    if (!item || !item.isActive) return res.status(404).json({ error: 'Furnitura topilmadi' });

    const [applicationCategories, relatedFurniture] = await Promise.all([
      item.applicationCategoryIds.length
        ? prisma.category.findMany({
            where: { id: { in: item.applicationCategoryIds } },
            select: { id: true, nameUz: true, nameRu: true, slug: true },
          })
        : Promise.resolve([]),
      item.categoryId
        ? prisma.furniture.findMany({
            where: { categoryId: item.categoryId, isActive: true, id: { not: item.id } },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            take: 4,
            include: { category: true },
          })
        : Promise.resolve([]),
    ]);

    const { productLinks, ...rest } = item;
    res.json({
      item: {
        ...rest,
        products: productLinks.map((link) => ({ ...link.product, quantity: link.quantity })),
        applicationCategories,
        relatedFurniture,
      },
    });
  })
);

// Public catalog listing (src/pages/Materials.tsx "Furnitura" section) — only
// active furniture, ordered the same way as the admin list.
furnitureRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const items = await prisma.furniture.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: true },
    });
    res.json({ items });
  })
);

furnitureRouter.get(
  '/admin',
  requireAuth,
  requirePermission('products', 'view'),
  asyncHandler(async (req, res) => {
    const q = req.query;
    const search = typeof q.search === 'string' && q.search.trim() ? q.search.trim() : undefined;
    const categoryId = typeof q.categoryId === 'string' && q.categoryId ? q.categoryId : undefined;
    const isActive = toBool(q.isActive);

    const where: Prisma.FurnitureWhereInput = {};
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { nameUz: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { article: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.furniture.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: true, _count: { select: { productLinks: true } } },
    });

    res.json({ items });
  })
);

furnitureRouter.get(
  '/:id',
  requireAuth,
  requirePermission('products', 'view'),
  asyncHandler(async (req, res) => {
    const item = await prisma.furniture.findUnique({
      where: { id: req.params.id },
      include: { category: true, _count: { select: { productLinks: true } } },
    });
    if (!item) return res.status(404).json({ error: 'Furnitura topilmadi' });
    res.json({ item });
  })
);

furnitureRouter.post(
  '/',
  requireAuth,
  requirePermission('products', 'create'),
  asyncHandler(async (req, res) => {
    const item = await prisma.furniture.create({ data: req.body });
    res.status(201).json({ item });
  })
);

furnitureRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('products', 'edit'),
  asyncHandler(async (req, res) => {
    const item = await prisma.furniture.update({ where: { id: req.params.id }, data: req.body });
    res.json({ item });
  })
);

furnitureRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('products', 'delete'),
  asyncHandler(async (req, res) => {
    // ProductFurniture rows cascade-delete automatically (onDelete: Cascade in schema),
    // so no orphaned join rows remain — the frontend warns the admin beforehand using
    // the _count.productLinks figure returned by the list/get endpoints above.
    await prisma.furniture.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);
