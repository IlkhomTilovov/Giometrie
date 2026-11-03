export function getPricingCopy(language: string) {
  return language === 'ru' ? {
    priceOnRequest: 'По расчёту',
    explanation: 'Стоимость рассчитывается с учётом размеров, материалов и проекта.',
    knownSubtotal: 'Сумма по справочным ценам образцов',
    requestQuote: 'Запросить расчёт',
    requestTitle: 'Запрос на расчёт',
    requestSent: 'Запрос принят. Мы свяжемся с вами, чтобы уточнить детали и рассчитать стоимость.',
    addToSelection: 'Выбрать для расчёта',
  } : {
    priceOnRequest: 'Hisob-kitob bo‘yicha',
    explanation: 'Narx o‘lcham, material va loyiha bo‘yicha hisoblanadi.',
    knownSubtotal: 'Namunalarning ma’lumot uchun ko‘rsatilgan narxlari yig‘indisi',
    requestQuote: 'Hisob-kitob so‘rash',
    requestTitle: 'Hisob-kitob uchun so‘rov',
    requestSent: 'So‘rovingiz qabul qilindi. Tafsilotlarni aniqlash va narxni hisoblash uchun siz bilan bog‘lanamiz.',
    addToSelection: 'Hisob-kitob uchun tanlash',
  };
}
