import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertFurnitureCategory(slug: string, nameUz: string, nameRu: string, sortOrder: number) {
  return prisma.furnitureCategory.upsert({
    where: { slug },
    update: { nameUz, nameRu },
    create: { slug, nameUz, nameRu, sortOrder },
  });
}

async function upsertFurniture(opts: {
  slug: string;
  nameUz: string;
  nameRu: string;
  categoryId: string;
  brand?: string;
  model?: string;
  article?: string;
}) {
  const data = {
    nameUz: opts.nameUz,
    nameRu: opts.nameRu,
    categoryId: opts.categoryId,
    brand: opts.brand,
    model: opts.model,
    article: opts.article,
  };
  return prisma.furniture.upsert({
    where: { slug: opts.slug },
    update: data,
    create: { slug: opts.slug, ...data },
  });
}

async function linkFurniture(productSlug: string, items: { furnitureId: string; quantity: number }[]) {
  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product) {
    console.log(`  ! Mahsulot topilmadi: ${productSlug} — bog'lash o'tkazib yuborildi`);
    return;
  }
  await prisma.$transaction([
    prisma.productFurniture.deleteMany({ where: { productId: product.id, furnitureId: { in: items.map((i) => i.furnitureId) } } }),
    prisma.productFurniture.createMany({
      data: items.map((i) => ({ productId: product.id, furnitureId: i.furnitureId, quantity: i.quantity })),
    }),
  ]);
}

async function main() {
  console.log('== Furnitura turlari (FurnitureCategory) ==');
  const sharnir = await upsertFurnitureCategory('sharnir', 'Sharnir', 'Петля', 1);
  const rels = await upsertFurnitureCategory('rels', 'Rels', 'Направляющие', 2);
  const ruchka = await upsertFurnitureCategory('ruchka', 'Ruchka', 'Ручка', 3);
  const oyoq = await upsertFurnitureCategory('oyoq', 'Oyoq', 'Ножки', 4);
  const mexanizm = await upsertFurnitureCategory('mexanizm', 'Mexanizm', 'Механизм', 5);
  await upsertFurnitureCategory('boshqa', 'Boshqa', 'Другое', 6);
  console.log(`  ${sharnir.nameUz}, ${rels.nameUz}, ${ruchka.nameUz}, ${oyoq.nameUz}, ${mexanizm.nameUz}, Boshqa`);

  console.log('== Furniturlar (Furniture) ==');
  const blumSharnir = await upsertFurniture({
    slug: 'blum-sharnir',
    nameUz: 'Blum sharnir',
    nameRu: 'Петля Blum',
    categoryId: sharnir.id,
    brand: 'Blum',
    model: 'CLIP top BLUMOTION',
    article: 'BL-71B3550',
  });
  const gtvRels = await upsertFurniture({
    slug: 'gtv-rels',
    nameUz: 'GTV rels',
    nameRu: 'Направляющие GTV',
    categoryId: rels.id,
    brand: 'GTV',
    model: 'Standard',
    article: 'GTV-PB450',
  });
  const pushToOpen = await upsertFurniture({
    slug: 'push-to-open-mexanizmi',
    nameUz: 'Push-to-open mexanizmi',
    nameRu: 'Механизм Push-to-open',
    categoryId: mexanizm.id,
    brand: 'Blum',
  });
  const mebelRuchkasi = await upsertFurniture({
    slug: 'mebel-ruchkasi',
    nameUz: 'Mebel ruchkasi',
    nameRu: 'Мебельная ручка',
    categoryId: ruchka.id,
    model: 'Slim 128mm',
  });
  const mebelOyoq = await upsertFurniture({
    slug: 'mebel-oyoq',
    nameUz: 'Mebel oyoq',
    nameRu: 'Мебельная ножка',
    categoryId: oyoq.id,
    model: 'H-150mm',
  });
  console.log(`  ${blumSharnir.nameUz}, ${gtvRels.nameUz}, ${pushToOpen.nameUz}, ${mebelRuchkasi.nameUz}, ${mebelOyoq.nameUz}`);

  console.log('== Mahsulotlarga biriktirish ==');
  await linkFurniture('premium-kiyim-shkafi', [
    { furnitureId: blumSharnir.id, quantity: 6 },
    { furnitureId: gtvRels.id, quantity: 2 },
    { furnitureId: mebelRuchkasi.id, quantity: 4 },
  ]);
  await linkFurniture('ergonomik-ofis-stoli', [
    { furnitureId: mebelOyoq.id, quantity: 4 },
  ]);
  await linkFurniture('zamonaviy-oshxona-garnituri', [
    { furnitureId: blumSharnir.id, quantity: 10 },
    { furnitureId: pushToOpen.id, quantity: 4 },
    { furnitureId: mebelRuchkasi.id, quantity: 6 },
  ]);
  console.log('  3 ta mahsulotga furniturlar biriktirildi');

  console.log('\nTayyor!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
