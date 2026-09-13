import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function attr(icon: string, labelUz: string, labelRu: string, valueUz: string, valueRu: string) {
  return { id: uid(), icon, label_uz: labelUz, label_ru: labelRu, value_uz: valueUz, value_ru: valueRu };
}

async function setAttributes(slug: string, attributes: ReturnType<typeof attr>[]) {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) {
    console.log(`  ! Mahsulot topilmadi: ${slug} — o'tkazib yuborildi`);
    return;
  }
  await prisma.product.update({ where: { id: product.id }, data: { attributes } });
  console.log(`  ${product.nameUz}: ${attributes.length} ta xususiyat`);
}

async function main() {
  console.log('== Mahsulot xususiyatlari ==');

  await setAttributes('premium-kiyim-shkafi', [
    attr('ruler', "O'lcham", 'Размер', '200×60×220 sm', '200×60×220 см'),
    attr('layers', 'Material', 'Материал', 'LDSP, MDF', 'ЛДСП, МДФ'),
    attr('door-closed', 'Eshik turi', 'Тип дверей', "Sirg'aluvchi (купе)", 'Раздвижные (купе)'),
    attr('clock', 'Kafolat', 'Гарантия', '24 oy', '24 месяца'),
  ]);

  await setAttributes('ergonomik-ofis-stoli', [
    attr('ruler', "O'lcham", 'Размер', '140×70×75 sm', '140×70×75 см'),
    attr('layers', 'Material', 'Материал', 'Metall karkas + LDSP', 'Металлический каркас + ЛДСП'),
    attr('chevrons', 'Balandlik', 'Высота', 'Sozlanadigan (68-78 sm)', 'Регулируемая (68-78 см)'),
    attr('clock', 'Kafolat', 'Гарантия', '24 oy', '24 месяца'),
  ]);

  await setAttributes('zamonaviy-oshxona-garnituri', [
    attr('ruler', "O'lcham", 'Размер', '300×60×85 sm', '300×60×85 см'),
    attr('layers', 'Material', 'Материал', "MDF, namlikka chidamli", 'МДФ, влагостойкий'),
    attr('droplet', 'Namlikka chidamlilik', 'Влагостойкость', 'Yuqori', 'Высокая'),
    attr('clock', 'Kafolat', 'Гарантия', '24 oy', '24 месяца'),
  ]);

  console.log('\nTayyor!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
