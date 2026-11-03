import assert from 'node:assert/strict';
import test from 'node:test';
import { getCartPricing, hasFixedPrice } from '../shared/pricing.ts';

test('missing, zero and invalid prices require a quote instead of advertising a free item', () => {
  for (const price of [null, undefined, 0, -1, NaN, Infinity]) {
    assert.equal(hasFixedPrice(price), false);
    assert.deepEqual(getCartPricing([{ product: { price }, quantity: 2 }]), {
      pricedSubtotal: 0, requiresQuote: true,
    });
  }
});

test('reference catalogue prices retain their subtotal and still require a custom-order quote', () => {
  assert.deepEqual(getCartPricing([
    { product: { price: 125_000 }, quantity: 2 },
    { product: { price: 50_000 }, quantity: 3 },
  ]), { pricedSubtotal: 400_000, requiresQuote: true });
});

test('a mixed selection reports only the known subtotal and still requires a quote', () => {
  assert.deepEqual(getCartPricing([
    { product: { price: 125_000 }, quantity: 2 },
    { product: { price: null }, quantity: 1 },
  ]), { pricedSubtotal: 250_000, requiresQuote: true });
});

test('an empty cart has no quote and no subtotal', () => {
  assert.deepEqual(getCartPricing([]), { pricedSubtotal: 0, requiresQuote: false });
});
