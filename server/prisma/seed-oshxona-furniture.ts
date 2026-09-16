import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function uid(seed: string) {
  return `attr-${seed}`;
}

function attr(
  seed: string,
  icon: string,
  labelUz: string,
  labelRu: string,
  valueUz: string,
  valueRu: string
) {
  return {
    id: uid(seed),
    icon,
    label_uz: labelUz,
    label_ru: labelRu,
    value_uz: valueUz,
    value_ru: valueRu,
  };
}

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
  descriptionUz: string;
  descriptionRu: string;
  fullDescriptionUz: string;
  fullDescriptionRu: string;
  specifications: ReturnType<typeof attr>[];
}) {
  const data = {
    nameUz: opts.nameUz,
    nameRu: opts.nameRu,
    categoryId: opts.categoryId,
    descriptionUz: opts.descriptionUz,
    descriptionRu: opts.descriptionRu,
    fullDescriptionUz: opts.fullDescriptionUz,
    fullDescriptionRu: opts.fullDescriptionRu,
    specifications: opts.specifications,
  };
  return prisma.furniture.upsert({
    where: { slug: opts.slug },
    update: data,
    create: { slug: opts.slug, ...data },
  });
}

async function main() {
  console.log('== Furnitura turlari (FurnitureCategory) ==');
  const sharnir = await upsertFurnitureCategory('sharnir', 'Sharnir', 'Петля', 1);
  const rels = await upsertFurnitureCategory('rels', 'Rels', 'Направляющие', 2);
  const ruchka = await upsertFurnitureCategory('ruchka', 'Ruchka', 'Ручка', 3);
  const oyoq = await upsertFurnitureCategory('oyoq', 'Oyoq', 'Ножки', 4);
  const mexanizm = await upsertFurnitureCategory('mexanizm', 'Mexanizm', 'Механизм', 5);
  const santexnika = await upsertFurnitureCategory('santexnika', 'Santexnika', 'Сантехника', 6);
  await upsertFurnitureCategory('boshqa', 'Boshqa', 'Другое', 7);

  console.log('== Furniturlar (Furniture) ==');
  const items = [
    {
      slug: 'mebel-sharniri',
      nameUz: 'Mebel sharniri',
      nameRu: 'Мебельная петля',
      categoryId: sharnir.id,
      descriptionUz: 'Yuqori shkaf eshiklari uchun',
      descriptionRu: 'Для дверей верхних шкафов',
      fullDescriptionUz:
        "Yuqori osma shkaflar fasad eshiklarini korpusga mahkamlash va ularning silliq ochilib-yopilishini ta'minlash uchun mo'ljallangan asosiy mebel furniturasi. Metall korpusli, bosim (klip) usulida o'rnatiladigan bo'lib, minimal bo'shliqda ham aniq ishlaydi va fasadning gorizontal, vertikal hamda chuqurlik bo'yicha moslanishiga (3D sozlash) imkon beradi.",
      fullDescriptionRu:
        'Основная мебельная фурнитура, предназначенная для крепления фасадных дверей навесных шкафов к корпусу и обеспечения их плавного открывания-закрывания. Металлический корпус крепится защёлкиванием (клипсовое крепление), точно работает даже при минимальном зазоре и позволяет регулировку фасада по трём осям (3D-регулировка).',
      specifications: [
        attr('sharnir-material', 'layers', 'Material', 'Материал', "Po'lat, nikel qoplama", 'Сталь, никелированное покрытие'),
        attr('sharnir-angle', 'chevrons', 'Ochilish burchagi', 'Угол открывания', '110°–165°', '110°–165°'),
        attr('sharnir-mount', 'blocks', 'Montaj turi', 'Тип крепления', "Klipsali (tez o'rnatiladigan)", 'Клипсовое (быстрый монтаж)'),
        attr('sharnir-adjust', 'ruler', 'Sozlash', 'Регулировка', '3D (balandlik, chuqurlik, yon)', '3D (высота, глубина, бок)'),
      ],
    },
    {
      slug: 'soft-close-sharnir',
      nameUz: 'Soft-close sharnir',
      nameRu: 'Петля Soft-close',
      categoryId: sharnir.id,
      descriptionUz: 'Sekin yopiladigan mexanizm',
      descriptionRu: 'Механизм плавного закрывания',
      fullDescriptionUz:
        "Ichiga o'rnatilgan gidravlik amortizator tufayli eshik yopilishining so'nggi bosqichida harakatni sekinlashtirib, ovozsiz va zarbasiz yopilishini ta'minlaydigan sharnir turi. Fasad va korpusning ortiqcha urilishdan shikastlanishini kamaytiradi hamda mebelning xizmat muddatini uzaytiradi.",
      fullDescriptionRu:
        'Тип петли со встроенным гидравлическим амортизатором, который замедляет движение двери на финальном этапе закрывания, обеспечивая бесшумное закрытие без удара. Снижает износ фасада и корпуса от ударов и продлевает срок службы мебели.',
      specifications: [
        attr('soft-damper', 'wind', 'Amortizator turi', 'Тип амортизатора', 'Gidravlik (yog\'li)', 'Гидравлический (масляный)'),
        attr('soft-cycles', 'loader', 'Chidamlilik', 'Ресурс', "80 000+ ochilish-yopilish sikli", '80 000+ циклов открывания-закрывания'),
        attr('soft-angle', 'chevrons', 'Ochilish burchagi', 'Угол открывания', '110°–155°', '110°–155°'),
        attr('soft-material', 'layers', 'Material', 'Материал', "Po'lat, nikel qoplama", 'Сталь, никелированное покрытие'),
      ],
    },
    {
      slug: 'teleskopik-yashirin-rels',
      nameUz: 'Teleskopik / yashirin rels',
      nameRu: 'Телескопические / скрытые направляющие',
      categoryId: rels.id,
      descriptionUz: 'Tortmalar uchun',
      descriptionRu: 'Для выдвижных ящиков',
      fullDescriptionUz:
        "Tortmalarni korpus ichidan to'liq chiqarib olish imkonini beruvchi sharikli podshipnikli rels tizimi. Tortma tubiga yashirin holda o'rnatilgani uchun tashqi tomondan ko'rinmaydi va fasadning estetik ko'rinishini buzmaydi. Yurish jarayoni yumshoq, tovushsiz va og'ir yuk ostida ham barqaror.",
      fullDescriptionRu:
        'Система направляющих на шариковых подшипниках, позволяющая полностью выдвигать ящик из корпуса. Монтируется скрыто в основании ящика, поэтому не видна снаружи и не портит эстетику фасада. Ход плавный, бесшумный и стабильный даже под значительной нагрузкой.',
      specifications: [
        attr('rels-extension', 'move3d', 'Chiqish darajasi', 'Степень выдвижения', "To'liq chiqish (100%)", 'Полное выдвижение (100%)'),
        attr('rels-load', 'weight', 'Yuk ko\'tarish', 'Грузоподъёмность', '25–40 kg', '25–40 кг'),
        attr('rels-length', 'ruler', "Uzunlik", 'Длина', '300–550 mm (o\'lchamga qarab)', '300–550 мм (в зависимости от размера)'),
        attr('rels-material', 'layers', 'Material', 'Материал', "Po'lat, sharikli podshipnik", 'Сталь, шариковые подшипники'),
      ],
    },
    {
      slug: 'push-to-open-mexanizmi',
      nameUz: 'Push-to-open mexanizm',
      nameRu: 'Механизм Push-to-open',
      categoryId: mexanizm.id,
      descriptionUz: 'Tutqichsiz fasadlar uchun',
      descriptionRu: 'Для фасадов без ручек',
      fullDescriptionUz:
        "Tutqichsiz (handle-less) fasadlarni ochish uchun ishlatiladigan mexanik mexanizm. Eshik yoki tortmaga yengil bosim berilganda pружinali qulf ochilib, fasad avtomatik biroz oldinga chiqadi. Minimalistik dizaynni saqlab, qo'l bilan tortish shart bo'lmasdan qulay foydalanishni ta'minlaydi.",
      fullDescriptionRu:
        'Механическое устройство для открывания фасадов без ручек (handle-less). При лёгком нажатии на дверь или ящик срабатывает пружинный фиксатор, и фасад слегка выдвигается вперёд. Сохраняет минималистичный дизайн и обеспечивает удобное открывание без необходимости тянуть за ручку.',
      specifications: [
        attr('push-principle', 'zap', 'Ishlash prinsipi', 'Принцип работы', "Bosim bilan ochiladigan pружinali qulf", 'Пружинный фиксатор, срабатывающий от нажатия'),
        attr('push-place', 'blocks', "O'rnatish joyi", 'Место установки', "Eshik yoki tortma ichki qismi", 'Внутренняя часть двери или ящика'),
        attr('push-material', 'layers', 'Material', 'Материал', 'Plastik va metall qism', 'Пластик и металлическая часть'),
        attr('push-cycles', 'loader', 'Chidamlilik', 'Ресурс', "20 000+ bosish sikli", '20 000+ циклов нажатия'),
      ],
    },
    {
      slug: 'lift-mexanizmi',
      nameUz: 'Lift mexanizmi',
      nameRu: 'Подъёмный механизм',
      categoryId: mexanizm.id,
      descriptionUz: "Yuqori ko'tariluvchi shkaf eshiklari uchun, agar mavjud bo'lsa",
      descriptionRu: 'Для поднимающихся вверх дверей шкафов, если предусмотрено',
      fullDescriptionUz:
        "Yuqoriga ko'tariladigan (lift-up) tipdagi shkaf eshiklarini ochish va ochiq holatda mustahkam ushlab turish uchun ishlatiladigan gaz porshenli mexanizm. Eshikning erkin yopilib qolishining oldini oladi va bosh bilan to'qnashuv xavfini kamaytiradi, shu bilan birga zamonaviy va yengil ochilish tajribasini yaratadi.",
      fullDescriptionRu:
        'Газонаполненный поршневой механизм для открывания и надёжной фиксации в открытом положении дверей шкафов подъёмного (lift-up) типа. Предотвращает самопроизвольное падение двери и снижает риск удара, обеспечивая современный и лёгкий опыт открывания.',
      specifications: [
        attr('lift-type', 'zap', 'Harakat turi', 'Тип привода', 'Gaz-porshenli (pnevmatik)', 'Газовый поршень (пневматический)'),
        attr('lift-force', 'weight', "Ko'tarish kuchi", 'Подъёмная сила', 'Eshik og\'irligiga mos tanlanadi', 'Подбирается по весу двери'),
        attr('lift-hold', 'chevrons', 'Fiksatsiya', 'Фиксация', "Ochiq holatda avtomatik ushlab turadi", 'Автоматическая фиксация в открытом положении'),
        attr('lift-safety', 'loader', 'Xavfsizlik', 'Безопасность', "Erkin tushib ketishdan himoya", 'Защита от свободного падения'),
      ],
    },
    {
      slug: 'mebel-ruchkasi',
      nameUz: 'Mebel ruchkasi',
      nameRu: 'Мебельная ручка',
      categoryId: ruchka.id,
      descriptionUz: "Rasmda deyarli ko'rinmaydi, chunki fasadlar asosan tutqichsiz",
      descriptionRu: 'На изображении почти не видна, так как фасады преимущественно без ручек',
      fullDescriptionUz:
        "Fasadlarni ochish uchun ishlatiladigan an'anaviy tutqich. Ushbu loyihada fasadlarning aksariyati tutqichsiz (push-to-open yoki profil tutqich) tarzda ishlangani sababli ruchka minimal miqdorda va ko'rinmas holatda, asosan yordamchi yoki alohida modullarda qo'llaniladi.",
      fullDescriptionRu:
        'Традиционная ручка для открывания фасадов. В данном проекте большинство фасадов выполнены без ручек (push-to-open или профильная ручка), поэтому ручка используется в минимальном количестве и практически незаметна — в основном на вспомогательных или отдельных модулях.',
      specifications: [
        attr('ruchka-material', 'layers', 'Material', 'Материал', 'Alyuminiy / metall', 'Алюминий / металл'),
        attr('ruchka-length', 'ruler', 'Uzunlik', 'Длина', '128–320 mm (modulga qarab)', '128–320 мм (в зависимости от модуля)'),
        attr('ruchka-finish', 'palette', 'Rang / qoplama', 'Цвет / покрытие', "Matoviy qora / xrom", 'Матовый чёрный / хром'),
        attr('ruchka-mount', 'blocks', 'Montaj turi', 'Тип крепления', "Vintli (fasad orqasidan)", 'Винтовое (с тыльной стороны фасада)'),
      ],
    },
    {
      slug: 'oshxona-oyoqchalari-sokol',
      nameUz: 'Oshxona oyoqchalari + sokol',
      nameRu: 'Кухонные ножки + цоколь',
      categoryId: oyoq.id,
      descriptionUz: 'Pastki modullar uchun',
      descriptionRu: 'Для нижних модулей',
      fullDescriptionUz:
        "Pastki (napolniy) modullarni pol sathidan ko'tarib, gorizontal darajaga sozlash uchun ishlatiladigan tayanch oyoqchalar, ularning tashqi ko'rinishini yopib turuvchi PVX yoki MDF sokol (plinth) paneli bilan birga qo'llaniladi. Namlik va mexanik ta'sirlardan himoyalaydi hamda tozalashni osonlashtiradi.",
      fullDescriptionRu:
        'Опорные ножки для установки и выравнивания нижних (напольных) модулей по горизонтали, применяемые вместе с ПВХ- или МДФ-панелью цоколя, скрывающей их снаружи. Защищают от влаги и механических воздействий, а также облегчают уборку.',
      specifications: [
        attr('oyoq-material', 'layers', 'Material', 'Материал', 'Plastik / metall oyoqcha', 'Пластиковая / металлическая ножка'),
        attr('oyoq-height', 'ruler', 'Balandligi', 'Высота', '100–150 mm, sozlanuvchan', '100–150 мм, регулируемая'),
        attr('oyoq-load', 'weight', "Yuk ko'tarish", 'Грузоподъёмность', 'Har biri 50–100 kg gacha', 'До 50–100 кг каждая'),
        attr('oyoq-sokol', 'blocks', 'Sokol paneli', 'Цокольная панель', "PVX / MDF, kliksli montaj", 'ПВХ / МДФ, клипсовый монтаж'),
      ],
    },
    {
      slug: 'tortma-mexanizmi',
      nameUz: 'Tortma mexanizmi',
      nameRu: 'Механизм выдвижного ящика',
      categoryId: mexanizm.id,
      descriptionUz: 'Oshxona tortmalari uchun',
      descriptionRu: 'Для кухонных выдвижных ящиков',
      fullDescriptionUz:
        "Oshxona tortmalarini yig'ish uchun ishlatiladigan to'liq metall korpusli tortma qutisi tizimi (metabox turi). Yon devorlari va tubi metalldan bo'lib, yuqori yuk ko'tarish qobiliyatiga ega, ko'pincha teleskopik rels va soft-close mexanizmi bilan birga o'rnatiladi.",
      fullDescriptionRu:
        'Система корпуса выдвижного ящика с цельнометаллическими стенками (тип метабокс) для сборки кухонных ящиков. Боковые стенки и дно выполнены из металла, обладают высокой грузоподъёмностью и часто устанавливаются в комплекте с телескопическими направляющими и механизмом soft-close.',
      specifications: [
        attr('tortma-material', 'layers', 'Material', 'Материал', "Po'lat (metabox turi)", 'Сталь (тип метабокс)'),
        attr('tortma-load', 'weight', "Yuk ko'tarish", 'Грузоподъёмность', '30–70 kg', '30–70 кг'),
        attr('tortma-height', 'chevrons', 'Balandlik turi', 'Тип высоты', 'Past / o\'rta / baland bort', 'Низкий / средний / высокий борт'),
        attr('tortma-extra', 'zap', "Qo'shimcha", 'Дополнительно', 'Soft-close bilan mos', 'Совместим с soft-close'),
      ],
    },
    {
      slug: 'rakovina-sifoni-chiqindi-tizimi',
      nameUz: 'Rakovina sifoni va chiqindi tizimi',
      nameRu: 'Сифон и система слива раковины',
      categoryId: santexnika.id,
      descriptionUz: 'Moyka qismida',
      descriptionRu: 'В зоне мойки',
      fullDescriptionUz:
        "Oshxona moykasidan (rakovinadan) chiqindi suvni kanalizatsiya tizimiga xavfsiz chiqarish uchun ishlatiladigan sifon va quvurlar majmuasi. Egilgan (S yoki gofr) shakli hidning xonaga o'tishining oldini oladi, PVX materialdan tayyorlanadi va o'rnatish uchun qo'shimcha moslamalar bilan birga keladi.",
      fullDescriptionRu:
        'Комплект сифона и труб для безопасного отвода сточных вод из кухонной мойки в канализационную систему. Изогнутая (S-образная или гофрированная) форма предотвращает проникновение запаха в помещение, изготавливается из ПВХ и поставляется с дополнительными крепёжными элементами.',
      specifications: [
        attr('sifon-material', 'layers', 'Material', 'Материал', 'PVX (polipropilen)', 'ПВХ (полипропилен)'),
        attr('sifon-type', 'blocks', 'Turi', 'Тип', "Butilkasimon (bottle) sifon", 'Бутылочный сифон'),
        attr('sifon-diameter', 'ruler', 'Diametri', 'Диаметр', "32–40 mm", '32–40 мм'),
        attr('sifon-feature', 'droplet', 'Xususiyati', 'Особенность', "Hid o'tkazmaydigan gidravlik to'siq", 'Гидрозатвор, предотвращающий запах'),
      ],
    },
    {
      slug: 'burchak-shkaf-mexanizmi',
      nameUz: 'Burchak shkaf mexanizmi',
      nameRu: 'Механизм углового шкафа',
      categoryId: mexanizm.id,
      descriptionUz: "Agar burchak modulining ichki qismida foydalanilgan bo'lsa",
      descriptionRu: 'Если используется во внутренней части углового модуля',
      fullDescriptionUz:
        "Burchak modullarining qiyin foydalaniladigan ichki hajmidan samarali foydalanish uchun mo'ljallangan aylanuvchi yoki chiquvchi mexanizm (masalan, karusel yoki \"sehrli burchak\" tizimi). Idish-tovoq va boshqa buyumlarga oson kirish imkonini berib, burchak fazosini to'liq band qiladi.",
      fullDescriptionRu:
        'Вращающийся или выдвижной механизм (например, карусель или система "магический угол"), предназначенный для эффективного использования труднодоступного внутреннего пространства угловых модулей. Обеспечивает лёгкий доступ к посуде и другим предметам, полностью задействуя угловое пространство.',
      specifications: [
        attr('burchak-type', 'blocks', 'Turi', 'Тип', "Karusel / \"sehrli burchak\"", 'Карусель / «магический угол»'),
        attr('burchak-material', 'layers', 'Material', 'Материал', "Metall karkas + plastik savat", 'Металлический каркас + пластиковые корзины'),
        attr('burchak-load', 'weight', "Yuk ko'tarish", 'Грузоподъёмность', '15–25 kg (har bir qavat)', '15–25 кг (каждый ярус)'),
        attr('burchak-motion', 'move3d', 'Harakat', 'Движение', "Aylanma va chiquvchi birgalikda", 'Вращательное и выдвижное одновременно'),
      ],
    },
  ];

  for (const item of items) {
    const created = await upsertFurniture(item);
    console.log(`  - ${created.nameUz}`);
  }

  console.log('\nTayyor!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
