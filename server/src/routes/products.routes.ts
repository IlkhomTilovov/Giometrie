import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { optionalAuth } from '../middleware/optionalAuth';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const productsRouter = Router();

function toArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toBool(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true' || value === '1' || value === true;
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

interface FurnitureItemInput {
  furnitureId: string;
  quantity?: number;
}

// Furniture is attached to a product through the same create/update body as every
// other field (matching how `promoTileIds` is just a plain array on Product) rather
// than a separate nested route. `furnitureItems` isn't a Prisma scalar on Product, so
// it must be pulled out of the body before the rest is passed straight to Prisma.
function extractFurnitureItems(body: Record<string, unknown>): FurnitureItemInput[] | undefined {
  const raw = body.furnitureItems;
  delete body.furnitureItems;
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((row): row is FurnitureItemInput => !!row && typeof row.furnitureId === 'string')
    .map((row) => ({
      furnitureId: row.furnitureId,
      quantity: Math.max(1, Number(row.quantity) || 1),
    }));
}

async function syncProductFurniture(productId: string, items: FurnitureItemInput[]) {
  await prisma.$transaction([
    prisma.productFurniture.deleteMany({ where: { productId } }),
    ...(items.length
      ? [
          prisma.productFurniture.createMany({
            data: items.map((it) => ({ productId, furnitureId: it.furnitureId, quantity: it.quantity ?? 1 })),
          }),
        ]
      : []),
  ]);
}

interface MaterialItemInput {
  materialId: string;
  quantity?: number;
}

// Materials work the same way as furniture (see extractFurnitureItems above), except a
// "material" is just another Product (one that lives in the Materials section) rather
// than a separate Furniture row.
function extractMaterialItems(body: Record<string, unknown>): MaterialItemInput[] | undefined {
  const raw = body.materialItems;
  delete body.materialItems;
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((row): row is MaterialItemInput => !!row && typeof row.materialId === 'string')
    .map((row) => ({
      materialId: row.materialId,
      quantity: Math.max(1, Number(row.quantity) || 1),
    }));
}

async function syncProductMaterials(productId: string, items: MaterialItemInput[]) {
  await prisma.$transaction([
    prisma.productMaterial.deleteMany({ where: { productId } }),
    ...(items.length
      ? [
          prisma.productMaterial.createMany({
            data: items.map((it) => ({ productId, materialId: it.materialId, quantity: it.quantity ?? 1 })),
          }),
        ]
      : []),
  ]);
}

function mapProductRelations(item: any) {
  if (!item) return item;
  const { furnitureLinks, materialLinks, ...rest } = item;
  const mapped: any = { ...rest };
  if (Array.isArray(furnitureLinks)) {
    mapped.furniture = furnitureLinks.map((link: any) => ({
      id: link.furniture.id,
      nameUz: link.furniture.nameUz,
      nameRu: link.furniture.nameRu,
      slug: link.furniture.slug,
      brand: link.furniture.brand,
      model: link.furniture.model,
      article: link.furniture.article,
      image: link.furniture.image,
      descriptionUz: link.furniture.descriptionUz,
      descriptionRu: link.furniture.descriptionRu,
      category: link.furniture.category
        ? { id: link.furniture.category.id, nameUz: link.furniture.category.nameUz, nameRu: link.furniture.category.nameRu }
        : null,
      quantity: link.quantity,
    }));
  }
  if (Array.isArray(materialLinks)) {
    mapped.materialProducts = materialLinks.map((link: any) => ({
      id: link.material.id,
      nameUz: link.material.nameUz,
      nameRu: link.material.nameRu,
      slug: link.material.slug,
      images: link.material.images,
      price: link.material.price,
      quantity: link.quantity,
    }));
  }
  return mapped;
}

productsRouter.get(
  '/filter-options',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { materials: true, colors: true, furLength: true, application: true, price: true },
    });

    const materials = new Set<string>();
    const colors = new Set<string>();
    const furLengths = new Set<string>();
    const applications = new Set<string>();
    let maxPrice = 0;

    for (const p of products) {
      p.materials.forEach((m) => materials.add(m));
      p.colors.forEach((c) => colors.add(c));
      p.furLength.forEach((f) => furLengths.add(f));
      p.application.forEach((a) => applications.add(a));
      if (p.price && p.price > maxPrice) maxPrice = p.price;
    }

    res.json({
      materials: [...materials],
      colors: [...colors],
      furLengths: [...furLengths],
      applications: [...applications],
      maxPrice: Math.ceil(maxPrice / 100000) * 100000,
    });
  })
);

productsRouter.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const items = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ items });
  })
);

productsRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = req.query;
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));

    const materials = toArray(q.materials);
    const colors = toArray(q.colors);
    const furLengths = toArray(q.furLengths);
    const applications = toArray(q.applications);
    const categoryIds = toArray(q.categoryIds);
    const productIds = toArray(q.productIds);
    const priceMin = toNumber(q.priceMin);
    const priceMax = toNumber(q.priceMax);
    const inStock = toBool(q.inStock);
    const isFeatured = toBool(q.isFeatured);
    const showInDiscountBanner = toBool(q.showInDiscountBanner);
    const discounted = toBool(q.discounted);
    const search = typeof q.search === 'string' && q.search.trim() ? q.search.trim() : undefined;

    // Only an authenticated admin-panel user may request inactive products or bypass the
    // active-only default entirely (e.g. admin product list / per-category product counts).
    const requestedIsActive = toBool(q.isActive);
    const bypassActiveFilter = !!req.user && toBool(q.all) === true;
    const isActive = bypassActiveFilter
      ? undefined
      : req.user && requestedIsActive === false
        ? false
        : requestedIsActive === undefined
          ? true
          : requestedIsActive;

    const where: Prisma.ProductWhereInput = isActive === undefined ? {} : { isActive };
    const and: Prisma.ProductWhereInput[] = [];

    if (q.categoryId && typeof q.categoryId === 'string') where.categoryId = q.categoryId;
    if (categoryIds?.length) where.categoryId = { in: categoryIds };
    if (productIds?.length) where.id = { in: productIds };
    // Price filters include products with no price set (e.g. negotiable-price items),
    // matching the original PostgREST `.or(price.gte.X,price.is.null)` behavior.
    if (priceMin !== undefined && priceMax !== undefined) {
      and.push({ OR: [{ AND: [{ price: { gte: priceMin } }, { price: { lte: priceMax } }] }, { price: null }] });
    } else if (priceMin !== undefined) {
      and.push({ OR: [{ price: { gte: priceMin } }, { price: null }] });
    } else if (priceMax !== undefined) {
      and.push({ OR: [{ price: { lte: priceMax } }, { price: null }] });
    }
    if (materials?.length) where.materials = { hasSome: materials };
    if (colors?.length) where.colors = { hasSome: colors };
    if (furLengths?.length) where.furLength = { hasSome: furLengths };
    if (applications?.length) where.application = { hasSome: applications };
    if (inStock !== undefined) where.inStock = inStock;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (showInDiscountBanner !== undefined) where.showInDiscountBanner = showInDiscountBanner;
    if (typeof q.promoTileId === 'string') where.promoTileIds = { has: q.promoTileId };
    if (search) {
      and.push({
        OR: [
          { nameUz: { contains: search, mode: 'insensitive' } },
          { nameRu: { contains: search, mode: 'insensitive' } },
          { descriptionUz: { contains: search, mode: 'insensitive' } },
          { descriptionRu: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (and.length) where.AND = and;

    if (discounted) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products WHERE original_price IS NOT NULL AND original_price > price
      `;
      const discountedIds = rows.map((r) => r.id);
      where.id = where.id ? { in: (where.id as { in: string[] }).in.filter((id) => discountedIds.includes(id)) } : { in: discountedIds };
    }

    // The admin product list needs each row's full attached furniture/materials (to
    // prefill the edit dialog's "Furnituralar"/"Materiallar" tabs without a second
    // request). The public catalog list only needs a small summary for the product
    // card, so it's capped at 3 per product — still a single join query, no N+1.
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          furnitureLinks: {
            include: { furniture: { include: { category: true } } },
            ...(req.user ? {} : { take: 3, orderBy: { createdAt: 'asc' as const } }),
          },
          materialLinks: {
            include: { material: true },
            ...(req.user ? {} : { take: 3, orderBy: { createdAt: 'asc' as const } }),
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items: items.map(mapProductRelations), total, page, pageSize });
  })
);

productsRouter.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const include = {
      furnitureLinks: {
        include: { furniture: { include: { category: true } } },
        orderBy: { createdAt: 'asc' as const },
      },
      materialLinks: {
        include: { material: true },
        orderBy: { createdAt: 'asc' as const },
      },
    };
    const item = isUuid
      ? await prisma.product.findUnique({ where: { id: idOrSlug }, include })
      : await prisma.product.findUnique({ where: { slug: idOrSlug }, include });
    if (!item) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json({ item: mapProductRelations(item) });
  })
);

productsRouter.post(
  '/',
  requireAuth,
  requirePermission('products', 'create'),
  asyncHandler(async (req, res) => {
    const furnitureItems = extractFurnitureItems(req.body);
    const materialItems = extractMaterialItems(req.body);
    const item = await prisma.product.create({ data: req.body });
    if (furnitureItems) await syncProductFurniture(item.id, furnitureItems);
    if (materialItems) await syncProductMaterials(item.id, materialItems);
    res.status(201).json({ item });
  })
);

productsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('products', 'edit'),
  asyncHandler(async (req, res) => {
    const furnitureItems = extractFurnitureItems(req.body);
    const materialItems = extractMaterialItems(req.body);
    const item = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    if (furnitureItems) await syncProductFurniture(item.id, furnitureItems);
    if (materialItems) await syncProductMaterials(item.id, materialItems);
    res.json({ item });
  })
);

productsRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('products', 'delete'),
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);
