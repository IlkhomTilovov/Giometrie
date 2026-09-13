// Per-page SEO metadata (title/description) in both languages.
// Single source of truth used by both the client (useSEO hook) and the
// server's bot-prerender routes, so a crawler and a real visitor always see
// the same title/description for a given page.

export type Lang = 'uz' | 'ru';

export type PageSeo = {
  title: string;
  description: string;
};

export type PageKey = 'home' | 'catalog' | 'about' | 'contact' | 'faq';

const SEO: Record<PageKey, Record<Lang, PageSeo>> = {
  home: {
    uz: {
      title:
        "Giometrie — Toshkentda premium mebel do'koni | Divan, stol, kreslo va to'liq interyer yechimlari",
      description:
        "Giometrie — Toshkentdagi zamonaviy va minimalist premium mebel do'koni: divanlar, stollar, kreslolar va to'liq xona dizayni. Toshkent va butun O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title:
        'Giometrie — магазин премиальной мебели в Ташкенте | Диваны, столы, кресла и комплексные решения для интерьера',
      description:
        'Giometrie — современный магазин премиальной мебели в Ташкенте: диваны, столы, кресла и комплексный дизайн интерьера. Доставка по Ташкенту и всему Узбекистану.',
    },
  },
  catalog: {
    uz: {
      title: 'Katalog — Giometrie mebel va interyer',
      description:
        "Giometrie katalogi: divanlar, kreslolar, stollar, shkaflar va boshqa premium mebel mahsulotlari. Narxlar, o'lchamlar va foto bilan tanlang.",
    },
    ru: {
      title: 'Каталог — мебель и интерьер Giometrie',
      description:
        'Каталог Giometrie: диваны, кресла, столы, шкафы и другая премиальная мебель. Выбирайте по цене, размеру и фото.',
    },
  },
  about: {
    uz: {
      title: 'Biz haqimizda — Giometrie',
      description:
        "Giometrie haqida: 10+ yillik tajriba, 5000+ mahsulot va 3000+ mamnun mijoz. Bizning qadriyatlarimiz, jamoamiz va O'zbekistondagi filiallarimiz.",
    },
    ru: {
      title: 'О нас — Giometrie',
      description:
        'О компании Giometrie: 10+ лет опыта, 5000+ товаров и 3000+ довольных клиентов. Наши ценности, команда и филиалы по Узбекистану.',
    },
  },
  contact: {
    uz: {
      title: 'Aloqa — Giometrie filiallari va manzillari',
      description:
        "Giometrie filiallari, manzillari va telefon raqamlari. Xaritada joylashuvni ko'ring, savolingizni yozing yoki bevosita bog'laning.",
    },
    ru: {
      title: 'Контакты — филиалы и адреса Giometrie',
      description:
        'Филиалы, адреса и телефоны Giometrie. Посмотрите расположение на карте, напишите нам или свяжитесь напрямую.',
    },
  },
  faq: {
    uz: {
      title: 'Savol-javob — Giometrie',
      description:
        "Giometrie bo'yicha eng ko'p beriladigan savollar: buyurtma, yetkazib berish, to'lov, kafolat va individual buyurtmalar haqida javoblar.",
    },
    ru: {
      title: 'Вопросы и ответы — Giometrie',
      description:
        'Самые частые вопросы об Giometrie: оформление заказа, доставка, оплата, гарантия и индивидуальные заказы.',
    },
  },
};

export function getPageSeo(page: PageKey, language: Lang): PageSeo {
  return SEO[page][language] || SEO[page].uz;
}
