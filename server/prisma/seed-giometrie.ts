import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function placeholderImage(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function upsertSection(slug: string, nameUz: string, nameRu: string, sortOrder: number) {
  return prisma.section.upsert({
    where: { slug },
    update: { nameUz, nameRu },
    create: { slug, nameUz, nameRu, sortOrder },
  });
}

async function upsertCategory(opts: {
  slug: string;
  nameUz: string;
  nameRu: string;
  sectionId: string;
  sortOrder: number;
}) {
  return prisma.category.upsert({
    where: { slug: opts.slug },
    update: { nameUz: opts.nameUz, nameRu: opts.nameRu, sectionId: opts.sectionId },
    create: {
      slug: opts.slug,
      nameUz: opts.nameUz,
      nameRu: opts.nameRu,
      sectionId: opts.sectionId,
      sortOrder: opts.sortOrder,
    },
  });
}

async function upsertProduct(opts: {
  slug: string;
  nameUz: string;
  nameRu: string;
  descriptionUz: string;
  descriptionRu: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  showInDiscountBanner?: boolean;
  images?: string[];
}) {
  const data = {
    nameUz: opts.nameUz,
    nameRu: opts.nameRu,
    descriptionUz: opts.descriptionUz,
    descriptionRu: opts.descriptionRu,
    categoryId: opts.categoryId,
    price: opts.price,
    originalPrice: opts.originalPrice,
    showInDiscountBanner: opts.showInDiscountBanner ?? false,
    images: opts.images ?? [],
  };
  return prisma.product.upsert({
    where: { slug: opts.slug },
    update: data,
    create: { slug: opts.slug, ...data },
  });
}

async function upsertPromoTile(opts: {
  titleUz: string;
  titleRu: string;
  icon: string;
  href: string;
  sortOrder: number;
}) {
  const existing = await prisma.promoTile.findFirst({ where: { titleUz: opts.titleUz } });
  if (existing) {
    return prisma.promoTile.update({ where: { id: existing.id }, data: opts });
  }
  return prisma.promoTile.create({ data: opts });
}

async function upsertSet(opts: { titleUz: string; titleRu: string; productIds: string[]; sortOrder: number }) {
  const existing = await prisma.set.findFirst({ where: { titleUz: opts.titleUz } });
  if (existing) {
    return prisma.set.update({ where: { id: existing.id }, data: opts });
  }
  return prisma.set.create({ data: opts });
}

async function main() {
  console.log("== Bo'limlar (Sections) ==");
  const shkaflar = await upsertSection('shkaflar', 'Shkaflar', 'Шкафы', 1);
  const ofis = await upsertSection('ofis-mebeli', 'Ofis mebeli', 'Офисная мебель', 2);
  const oshxona = await upsertSection('oshxona-mebeli', 'Oshxona mebeli', 'Кухонная мебель', 3);
  console.log(`  ${shkaflar.nameUz}, ${ofis.nameUz}, ${oshxona.nameUz}`);

  console.log('== Toifalar (Categories) ==');
  const kiyimShkaflari = await upsertCategory({
    slug: 'kiyim-shkaflari',
    nameUz: 'Kiyim shkaflari',
    nameRu: 'Шкафы для одежды',
    sectionId: shkaflar.id,
    sortOrder: 1,
  });
  const ofisStollari = await upsertCategory({
    slug: 'ofis-stollari',
    nameUz: 'Ofis stollari',
    nameRu: 'Офисные столы',
    sectionId: ofis.id,
    sortOrder: 2,
  });
  const oshxonaGarniturlari = await upsertCategory({
    slug: 'oshxona-garniturlari',
    nameUz: 'Oshxona garniturlari',
    nameRu: 'Кухонные гарнитуры',
    sectionId: oshxona.id,
    sortOrder: 3,
  });
  console.log(`  ${kiyimShkaflari.nameUz}, ${ofisStollari.nameUz}, ${oshxonaGarniturlari.nameUz}`);

  console.log('== Mahsulotlar (Products) ==');
  const shkafProduct = await upsertProduct({
    slug: 'premium-kiyim-shkafi',
    nameUz: 'Premium kiyim shkafi',
    nameRu: 'Премиум шкаф для одежды',
    descriptionUz:
      "Keng ichki bo'linmali, sirg'aluvchi eshikli premium kiyim shkafi. Har qanday yotoqxona yoki kiyim xonasiga mos keladi.",
    descriptionRu:
      'Премиум шкаф для одежды с раздвижными дверями и просторными отделениями. Подходит для любой спальни или гардеробной.',
    categoryId: kiyimShkaflari.id,
    price: 5200000,
    originalPrice: 6400000,
    showInDiscountBanner: true,
    images: [placeholderImage('Shkaf', '#6b5b45')],
  });
  const ofisProduct = await upsertProduct({
    slug: 'ergonomik-ofis-stoli',
    nameUz: 'Ergonomik ofis stoli',
    nameRu: 'Эргономичный офисный стол',
    descriptionUz:
      "Kabel boshqaruvi va keng ish yuzasiga ega zamonaviy ofis stoli. Uzoq ish kuni davomida qulaylik ta'minlaydi.",
    descriptionRu:
      'Современный офисный стол с управлением кабелями и просторной рабочей поверхностью. Обеспечивает комфорт в течение всего рабочего дня.',
    categoryId: ofisStollari.id,
    price: 2800000,
    images: [placeholderImage('Ofis', '#3f4a5c')],
  });
  const oshxonaProduct = await upsertProduct({
    slug: 'zamonaviy-oshxona-garnituri',
    nameUz: 'Zamonaviy oshxona garnituri',
    nameRu: 'Современный кухонный гарнитур',
    descriptionUz:
      "Namlikka chidamli materiallardan tayyorlangan, keng saqlash imkoniyatiga ega zamonaviy oshxona garnituri.",
    descriptionRu:
      'Современный кухонный гарнитур из влагостойких материалов с большим пространством для хранения.',
    categoryId: oshxonaGarniturlari.id,
    price: 9500000,
    originalPrice: 11200000,
    showInDiscountBanner: true,
    images: [placeholderImage('Oshxona', '#4a5c3f')],
  });
  console.log(`  ${shkafProduct.nameUz}, ${ofisProduct.nameUz}, ${oshxonaProduct.nameUz}`);

  console.log('== Promo kartochkalar (Promo tiles) ==');
  await upsertPromoTile({
    titleUz: "Shkaflar — individual o'lchamda",
    titleRu: 'Шкафы на заказ по размеру',
    icon: 'ruler',
    href: `/catalog?category=${kiyimShkaflari.slug}`,
    sortOrder: 1,
  });
  await upsertPromoTile({
    titleUz: 'Ofis mebeli — tezkor yetkazib berish',
    titleRu: 'Офисная мебель — быстрая доставка',
    icon: 'truck',
    href: `/catalog?category=${ofisStollari.slug}`,
    sortOrder: 2,
  });
  await upsertPromoTile({
    titleUz: 'Oshxona garniturlari — maxsus dizayn',
    titleRu: 'Кухонные гарнитуры — индивидуальный дизайн',
    icon: 'sparkles',
    href: `/catalog?category=${oshxonaGarniturlari.slug}`,
    sortOrder: 3,
  });
  console.log('  3 ta promo kartochka tayyor');

  console.log("== Setlar to'plami (Sets) ==");
  await upsertSet({
    titleUz: "Shkaf to'plami",
    titleRu: 'Комплект шкафов',
    productIds: [shkafProduct.id],
    sortOrder: 1,
  });
  await upsertSet({
    titleUz: "Ofis to'plami",
    titleRu: 'Офисный комплект',
    productIds: [ofisProduct.id],
    sortOrder: 2,
  });
  await upsertSet({
    titleUz: "Oshxona to'plami",
    titleRu: 'Кухонный комплект',
    productIds: [oshxonaProduct.id],
    sortOrder: 3,
  });
  console.log('  3 ta set tayyor');

  console.log('\nTayyor! Barcha yozuvlar admin panelda tahrirlash uchun mavjud.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
