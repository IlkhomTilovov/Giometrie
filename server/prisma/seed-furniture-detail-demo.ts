import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function placeholderImage(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="36" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function attr(icon: string, labelUz: string, labelRu: string, valueUz: string, valueRu: string) {
  return { id: uid(), icon, label_uz: labelUz, label_ru: labelRu, value_uz: valueUz, value_ru: valueRu };
}

async function main() {
  const furniture = await prisma.furniture.findUnique({ where: { slug: 'blum-sharnir' } });
  if (!furniture) {
    console.log("Blum sharnir topilmadi — o'tkazib yuborildi");
    return;
  }

  const categories = await prisma.category.findMany({ take: 2 });

  await prisma.furniture.update({
    where: { id: furniture.id },
    data: {
      image: placeholderImage('Blum sharnir', '#6b5b45'),
      images: [
        placeholderImage('Yon korinish', '#7a6a52'),
        placeholderImage('Ornatilgan', '#5c4e3a'),
        placeholderImage('Yaqin plan', '#8a7a60'),
      ],
      descriptionUz: 'CLIP top BLUMOTION seriyasidagi zamonaviy mebel sharniri — yumshoq yopilish va uzoq muddatli xizmat.',
      descriptionRu: 'Современная мебельная петля серии CLIP top BLUMOTION — плавное закрывание и долгий срок службы.',
      fullDescriptionUz:
        "Blum CLIP top BLUMOTION sharniri yuqori sifatli metalldan tayyorlangan bo'lib, eshiklarni shovqinsiz va yumshoq yopilishini ta'minlaydi. Mingdan ortiq ochilish-yopilish sikliga bardosh beradi va turli qalinlikdagi eshiklar uchun moslashuvchan sozlash imkoniyatiga ega.",
      fullDescriptionRu:
        'Петля Blum CLIP top BLUMOTION изготовлена из высококачественного металла и обеспечивает бесшумное и плавное закрывание дверей. Выдерживает более тысячи циклов открывания-закрывания и имеет гибкую регулировку для дверей разной толщины.',
      specifications: [
        attr('layers', 'Material', 'Материал', 'Metall (nikel qoplama)', 'Металл (никелевое покрытие)'),
        attr('ruler', 'Ochilish burchagi', 'Угол открывания', '110°', '110°'),
        attr('weight', "Yuk ko'tarish", 'Нагрузка', '85 gramgacha', 'До 85 грамм'),
        attr('zap', 'Mexanizm', 'Механизм', 'BLUMOTION (yumshoq yopilish)', 'BLUMOTION (плавное закрывание)'),
      ],
      applicationCategoryIds: categories.map((c) => c.id),
      installationTypeUz: "Vintlar bilan mahkamlash (yopishtirilmaydi)",
      installationTypeRu: 'Крепление винтами (не приклеивается)',
      usageInstructionsUz:
        "O'rnatishdan oldin eshik qalinligini o'lchang va mos plastinani tanlang. Sharnir korpusga, plastina eshikka mahkamlanadi.",
      usageInstructionsRu:
        'Перед установкой измерьте толщину двери и подберите подходящую монтажную планку. Петля крепится к корпусу, планка — к двери.',
      installationNotesUz: "Eshik og'irligi 40 kg dan oshmasligi tavsiya etiladi.",
      installationNotesRu: 'Рекомендуемый вес двери — не более 40 кг.',
      metaTitleUz: 'Blum sharnir CLIP top BLUMOTION | Giometrie',
      metaTitleRu: 'Петля Blum CLIP top BLUMOTION | Giometrie',
      metaDescriptionUz: 'Blum CLIP top BLUMOTION sharniri — yumshoq yopilish, yuqori sifat, 24 oy kafolat.',
      metaDescriptionRu: 'Петля Blum CLIP top BLUMOTION — плавное закрывание, высокое качество, гарантия 24 месяца.',
      metaKeywords: 'blum sharnir, mebel furnituras, blumotion',
    },
  });

  console.log('Blum sharnir to\'liq ma\'lumot bilan yangilandi.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
