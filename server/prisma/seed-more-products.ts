import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function uid(seed: string) {
  return `attr-${seed}`;
}

function attr(seed: string, icon: string, labelUz: string, labelRu: string, valueUz: string, valueRu: string) {
  return { id: uid(seed), icon, label_uz: labelUz, label_ru: labelRu, value_uz: valueUz, value_ru: valueRu };
}

async function upsertProduct(opts: {
  slug: string;
  nameUz: string;
  nameRu: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  descriptionUz: string;
  descriptionRu: string;
  fullDescriptionUz: string;
  fullDescriptionRu: string;
  attributes: ReturnType<typeof attr>[];
  reuseImageFromSlug: string;
  furnitureSlugs: { slug: string; quantity: number }[];
  setTitleUz: string;
}) {
  const category = await prisma.category.findUnique({ where: { slug: opts.categorySlug } });
  if (!category) throw new Error(`Category not found: ${opts.categorySlug}`);

  const sourceProduct = await prisma.product.findUnique({ where: { slug: opts.reuseImageFromSlug } });
  const images = sourceProduct?.images?.length ? sourceProduct.images : [];

  const product = await prisma.product.upsert({
    where: { slug: opts.slug },
    update: {},
    create: {
      slug: opts.slug,
      nameUz: opts.nameUz,
      nameRu: opts.nameRu,
      categoryId: category.id,
      price: opts.price,
      originalPrice: opts.originalPrice ?? null,
      images,
      descriptionUz: opts.descriptionUz,
      descriptionRu: opts.descriptionRu,
      fullDescriptionUz: opts.fullDescriptionUz,
      fullDescriptionRu: opts.fullDescriptionRu,
      attributes: opts.attributes,
      isActive: true,
      inStock: true,
      sortOrder: 0,
    },
  });

  const furniture = await prisma.furniture.findMany({ where: { slug: { in: opts.furnitureSlugs.map((f) => f.slug) } } });
  const furnitureBySlug = new Map(furniture.map((f) => [f.slug, f]));
  const links = opts.furnitureSlugs
    .map((f) => ({ furnitureId: furnitureBySlug.get(f.slug)?.id, quantity: f.quantity }))
    .filter((f): f is { furnitureId: string; quantity: number } => !!f.furnitureId);

  await prisma.$transaction([
    prisma.productFurniture.deleteMany({ where: { productId: product.id } }),
    ...(links.length
      ? [
          prisma.productFurniture.createMany({
            data: links.map((l) => ({ productId: product.id, furnitureId: l.furnitureId, quantity: l.quantity })),
          }),
        ]
      : []),
  ]);

  const set = await prisma.set.findFirst({ where: { titleUz: opts.setTitleUz } });
  if (set && !set.productIds.includes(product.id)) {
    await prisma.set.update({
      where: { id: set.id },
      data: { productIds: [...set.productIds, product.id] },
    });
  }

  return product;
}

async function main() {
  console.log('== Shkaf (Kiyim shkaflari) ==');
  await upsertProduct({
    slug: 'klassik-kiyim-shkafi',
    nameUz: 'Klassik kiyim shkafi',
    nameRu: 'Классический шкаф для одежды',
    categorySlug: 'kiyim-shkaflari',
    price: 3800000,
    descriptionUz: "An'anaviy ochiladigan eshikli, ixcham va qulay kiyim shkafi.",
    descriptionRu: 'Компактный и удобный шкаф для одежды с традиционными распашными дверями.',
    fullDescriptionUz:
      "Kundalik foydalanish uchun mo'ljallangan klassik uslubdagi kiyim shkafi. Ikki eshikli konstruksiya, ichki qismida ko'ylaklar uchun shtanga va bir nechta javonlar joylashgan. Yotoqxona yoki mehmonxona uchun mos, oddiy va ishonchli dizayn.",
    fullDescriptionRu:
      'Шкаф для одежды в классическом стиле для повседневного использования. Двустворчатая конструкция, внутри штанга для одежды и несколько полок. Подходит для спальни или гостиной, простой и надёжный дизайн.',
    attributes: [
      attr('klassik-shkaf-olcham', 'ruler', "O'lcham", 'Размер', '180×60×210 sm', '180×60×210 см'),
      attr('klassik-shkaf-material', 'layers', 'Material', 'Материал', 'LDSP', 'ЛДСП'),
      attr('klassik-shkaf-eshik', 'door-closed', 'Eshik turi', 'Тип дверей', 'Ochiladigan (2 eshikli)', 'Распашные (2 двери)'),
      attr('klassik-shkaf-kafolat', 'clock', 'Kafolat', 'Гарантия', '18 oy', '18 месяцев'),
    ],
    reuseImageFromSlug: 'premium-kiyim-shkafi',
    furnitureSlugs: [
      { slug: 'mebel-sharniri', quantity: 4 },
      { slug: 'mebel-ruchkasi', quantity: 2 },
    ],
    setTitleUz: "Shkaf to'plami",
  });

  await upsertProduct({
    slug: 'kompakt-kiyim-shkafi',
    nameUz: 'Kompakt kiyim shkafi',
    nameRu: 'Компактный шкаф для одежды',
    categorySlug: 'kiyim-shkaflari',
    price: 4500000,
    originalPrice: 5000000,
    descriptionUz: "Kichik xonalar uchun mo'ljallangan, sirg'aluvchi eshikli tejamkor shkaf.",
    descriptionRu: 'Экономичный шкаф с раздвижными дверями, разработанный для небольших комнат.',
    fullDescriptionUz:
      "Yer maydoni tejaladigan sirg'aluvchi (kupe) eshikli konstruksiya tufayli kichik xonalarda ham qulay joylashadi. Ichki tashkilot yaxshi o'ylangan — kiyimlar, ko'ylaklar va aksessuarlar uchun alohida bo'limlar mavjud.",
    fullDescriptionRu:
      'Благодаря раздвижным (купе) дверям экономит пространство и удобно вписывается даже в небольшие комнаты. Продуманная внутренняя организация — отдельные секции для одежды и аксессуаров.',
    attributes: [
      attr('kompakt-shkaf-olcham', 'ruler', "O'lcham", 'Размер', '120×55×200 sm', '120×55×200 см'),
      attr('kompakt-shkaf-material', 'layers', 'Material', 'Материал', 'MDF', 'МДФ'),
      attr('kompakt-shkaf-eshik', 'door-closed', 'Eshik turi', 'Тип дверей', "Sirg'aluvchi (kupe)", 'Раздвижные (купе)'),
      attr('kompakt-shkaf-kafolat', 'clock', 'Kafolat', 'Гарантия', '24 oy', '24 месяца'),
    ],
    reuseImageFromSlug: 'premium-kiyim-shkafi',
    furnitureSlugs: [
      { slug: 'teleskopik-yashirin-rels', quantity: 2 },
      { slug: 'soft-close-sharnir', quantity: 2 },
      { slug: 'push-to-open-mexanizmi', quantity: 1 },
    ],
    setTitleUz: "Shkaf to'plami",
  });

  console.log('== Ofis (Ofis stollari) ==');
  await upsertProduct({
    slug: 'boshqaruvchi-stoli',
    nameUz: 'Boshqaruvchi stoli',
    nameRu: 'Стол руководителя',
    categorySlug: 'ofis-stollari',
    price: 4200000,
    originalPrice: 4800000,
    descriptionUz: "Keng ish yuzasi va massiv qismlariga ega premium boshqaruvchi stoli.",
    descriptionRu: 'Премиальный стол руководителя с просторной рабочей поверхностью и массивными элементами.',
    fullDescriptionUz:
      "Rahbar kabinetlari uchun mo'ljallangan, keng va bardoshli ish yuzasiga ega premium stol. Uchta tortmali yon blok, kabel boshqaruv tizimi va yuqori sifatli material birikmasi (massiv yog'och + LDSP) bilan ishlab chiqarilgan.",
    fullDescriptionRu:
      'Премиальный стол с широкой и прочной рабочей поверхностью для кабинетов руководителей. Боковой блок с тремя ящиками, система управления кабелями, выполнен из сочетания массива дерева и ЛДСП.',
    attributes: [
      attr('boshqaruvchi-olcham', 'ruler', "O'lcham", 'Размер', '180×90×75 sm', '180×90×75 см'),
      attr('boshqaruvchi-material', 'layers', 'Material', 'Материал', 'Massiv yog\'och + LDSP', 'Массив дерева + ЛДСП'),
      attr('boshqaruvchi-tortma', 'archive', 'Tortmalar soni', 'Количество ящиков', '3 ta', '3 шт'),
      attr('boshqaruvchi-kafolat', 'clock', 'Kafolat', 'Гарантия', '24 oy', '24 месяца'),
    ],
    reuseImageFromSlug: 'ergonomik-ofis-stoli',
    furnitureSlugs: [
      { slug: 'tortma-mexanizmi', quantity: 3 },
      { slug: 'teleskopik-yashirin-rels', quantity: 3 },
      { slug: 'mebel-ruchkasi', quantity: 3 },
    ],
    setTitleUz: 'Ofis to\'plami',
  });

  await upsertProduct({
    slug: 'kompakt-ish-stoli',
    nameUz: 'Kompakt ish stoli',
    nameRu: 'Компактный рабочий стол',
    categorySlug: 'ofis-stollari',
    price: 1650000,
    descriptionUz: "Uy va kichik ofis uchun mo'ljallangan ixcham ish stoli.",
    descriptionRu: 'Компактный рабочий стол для дома и небольшого офиса.',
    fullDescriptionUz:
      "Kichik xonalar va uy-ofis uchun qulay ixcham stol. Yashirin kabel boshqaruv tizimi bilan jihozlangan, yengil vazni tufayli kerak bo'lganda joyini almashtirish oson.",
    fullDescriptionRu:
      'Удобный компактный стол для небольших комнат и домашнего офиса. Оснащён скрытой системой управления кабелями, благодаря лёгкому весу его легко переставить при необходимости.',
    attributes: [
      attr('kompakt-stol-olcham', 'ruler', "O'lcham", 'Размер', '120×60×75 sm', '120×60×75 см'),
      attr('kompakt-stol-material', 'layers', 'Material', 'Материал', 'LDSP', 'ЛДСП'),
      attr('kompakt-stol-kabel', 'zap', 'Kabel boshqaruvi', 'Управление кабелями', 'Mavjud', 'Есть'),
    ],
    reuseImageFromSlug: 'ergonomik-ofis-stoli',
    furnitureSlugs: [
      { slug: 'mebel-oyoq', quantity: 4 },
      { slug: 'tortma-mexanizmi', quantity: 1 },
    ],
    setTitleUz: 'Ofis to\'plami',
  });

  console.log('== Oshxona (Oshxona garniturlari) ==');
  await upsertProduct({
    slug: 'chiziqli-oshxona-garnituri',
    nameUz: 'Chiziqli oshxona garnituri',
    nameRu: 'Линейный кухонный гарнитур',
    categorySlug: 'oshxona-garniturlari',
    price: 7200000,
    originalPrice: 8000000,
    descriptionUz: "Ixcham oshxonalar uchun mo'ljallangan, bir devor bo'ylab joylashuvchi garnitur.",
    descriptionRu: 'Кухонный гарнитур линейной планировки вдоль одной стены — для компактных кухонь.',
    fullDescriptionUz:
      "Bir chiziq bo'ylab joylashgan, kichik va o'rta o'lchamdagi oshxonalar uchun qulay garnitur. MDF fasadlar, LDSP korpus va ichki tashkilot uchun keng tortmalar bilan jihozlangan.",
    fullDescriptionRu:
      'Гарнитур линейной планировки — удобное решение для малых и средних кухонь. МДФ-фасады, корпус из ЛДСП, просторные ящики для внутренней организации.',
    attributes: [
      attr('chiziqli-oshxona-olcham', 'ruler', "O'lcham", 'Размер', '240×60×85 sm', '240×60×85 см'),
      attr('chiziqli-oshxona-material', 'layers', 'Material', 'Материал', 'LDSP + MDF fasad', 'ЛДСП + фасад МДФ'),
      attr('chiziqli-oshxona-turi', 'blocks', 'Turi', 'Тип', 'Chiziqli', 'Линейный'),
      attr('chiziqli-oshxona-kafolat', 'clock', 'Kafolat', 'Гарантия', '24 oy', '24 месяца'),
    ],
    reuseImageFromSlug: 'zamonaviy-oshxona-garnituri',
    furnitureSlugs: [
      { slug: 'mebel-sharniri', quantity: 8 },
      { slug: 'tortma-mexanizmi', quantity: 4 },
      { slug: 'rakovina-sifoni-chiqindi-tizimi', quantity: 1 },
      { slug: 'oshxona-oyoqchalari-sokol', quantity: 1 },
    ],
    setTitleUz: "Oshxona to'plami",
  });

  await upsertProduct({
    slug: 'burchakli-oshxona-garnituri',
    nameUz: 'Burchakli oshxona garnituri',
    nameRu: 'Угловой кухонный гарнитур',
    categorySlug: 'oshxona-garniturlari',
    price: 12500000,
    descriptionUz: "Burchak maydonidan samarali foydalanuvchi, keng saqlash hajmiga ega premium garnitur.",
    descriptionRu: 'Премиальный гарнитур с угловой планировкой и большим объёмом хранения.',
    fullDescriptionUz:
      "Oshxonaning burchak maydonidan to'liq foydalanish imkonini beruvchi premium darajadagi garnitur. Yuqori sifatli MDF fasadlar, burchak modulida aylanma mexanizm va yuqori ko'tariluvchi eshiklar bilan jihozlangan.",
    fullDescriptionRu:
      'Премиальный гарнитур, полностью использующий угловое пространство кухни. Фасады из высококачественного МДФ, вращающийся механизм в угловом модуле и двери с подъёмным механизмом.',
    attributes: [
      attr('burchakli-oshxona-olcham', 'ruler', "O'lcham", 'Размер', '300×180×85 sm', '300×180×85 см'),
      attr('burchakli-oshxona-material', 'layers', 'Material', 'Материал', "MDF (yuqori sifat)", 'МДФ (высокое качество)'),
      attr('burchakli-oshxona-turi', 'blocks', 'Turi', 'Тип', 'Burchakli', 'Угловой'),
      attr('burchakli-oshxona-kafolat', 'clock', 'Kafolat', 'Гарантия', '36 oy', '36 месяцев'),
    ],
    reuseImageFromSlug: 'zamonaviy-oshxona-garnituri',
    furnitureSlugs: [
      { slug: 'burchak-shkaf-mexanizmi', quantity: 1 },
      { slug: 'blum-sharnir', quantity: 10 },
      { slug: 'push-to-open-mexanizmi', quantity: 4 },
      { slug: 'lift-mexanizmi', quantity: 2 },
    ],
    setTitleUz: "Oshxona to'plami",
  });

  console.log('\nTayyor!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
