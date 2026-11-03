/** Validate a reference catalogue amount; final custom-order prices require a quote. */
export function hasFixedPrice(price: number | null | undefined): price is number {
  return typeof price === 'number' && Number.isFinite(price) && price > 0;
}

export function getCartPricing(items: readonly {
  product: { price?: number | null };
  quantity: number;
}[]) {
  return items.reduce(
    (summary, item) => {
      if (hasFixedPrice(item.product.price)) {
        summary.pricedSubtotal += item.product.price * item.quantity;
      } else {
        summary.requiresQuote = true;
      }
      return summary;
    },
    { pricedSubtotal: 0, requiresQuote: items.length > 0 },
  );
}
