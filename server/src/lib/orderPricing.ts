import { hasFixedPrice } from '@shared/pricing';

interface PricedOrderItem {
  price: number;
  quantity: number;
  price_on_request?: boolean;
}

interface PricedOrder {
  total_price: number;
  price_on_request?: boolean;
  items: PricedOrderItem[];
}

function itemRequiresQuote(item: PricedOrderItem): boolean {
  return item.price_on_request === true || !hasFixedPrice(item.price);
}

export function formatOrderItemPrice(item: PricedOrderItem, locale: string): string {
  if (itemRequiresQuote(item)) return "Narx hisob-kitobdan so'ng aniqlanadi";
  return `${new Intl.NumberFormat(locale).format(item.price * item.quantity)} so'm`;
}

export function formatOrderTotal(order: PricedOrder, locale: string): string {
  const requiresQuote = order.price_on_request === true
    || !hasFixedPrice(order.total_price)
    || order.items.some(itemRequiresQuote);

  if (!requiresQuote) return `${new Intl.NumberFormat(locale).format(order.total_price)} so'm`;

  // The numeric total remains a compatibility field, so label only the known
  // subtotal when even one item still needs a quote.
  const pricedSubtotal = order.items.reduce(
    (sum, item) => sum + (itemRequiresQuote(item) ? 0 : item.price * item.quantity),
    0,
  );
  const quote = "Hisob-kitobdan so'ng aniqlanadi";
  return hasFixedPrice(pricedSubtotal)
    ? `${quote} (narxi belgilangan mahsulotlar: ${new Intl.NumberFormat(locale).format(pricedSubtotal)} so'm)`
    : quote;
}
