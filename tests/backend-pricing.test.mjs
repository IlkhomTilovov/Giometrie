import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';
import * as pricing from '../shared/pricing.ts';

// Load the backend with explicit in-memory dependencies: no env file, database,
// HTTP client or notification sender can be reached by these tests.
function loadBackend(relativePath, imports) {
  const source = readFileSync(new URL(`../server/src/${relativePath}`, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
      return imports[name];
    },
    console,
  }, { filename: relativePath });
  return exports;
}

const orderPricing = loadBackend('lib/orderPricing.ts', { '@shared/pricing': pricing });

test('notification amounts distinguish fixed, quoted and mixed selections', () => {
  const fixed = { price: 125_000, quantity: 2 };
  const unknown = { price: 0, quantity: 1 };
  assert.equal(orderPricing.formatOrderItemPrice(fixed, 'uz-UZ'), `${new Intl.NumberFormat('uz-UZ').format(250_000)} so'm`);
  for (const price of [0, null, undefined, -1, NaN, Infinity]) {
    assert.equal(orderPricing.formatOrderItemPrice({ price, quantity: 1 }, 'uz-UZ'), "Narx hisob-kitobdan so'ng aniqlanadi");
  }
  assert.equal(orderPricing.formatOrderTotal({ total_price: 250_000, items: [fixed] }, 'uz-UZ'), `${new Intl.NumberFormat('uz-UZ').format(250_000)} so'm`);
  assert.equal(orderPricing.formatOrderTotal({ total_price: 0, items: [unknown] }, 'uz-UZ'), "Hisob-kitobdan so'ng aniqlanadi");
  assert.equal(orderPricing.formatOrderTotal({ total_price: 250_000, items: [fixed, unknown] }, 'uz-UZ'), `Hisob-kitobdan so'ng aniqlanadi (narxi belgilangan mahsulotlar: ${new Intl.NumberFormat('uz-UZ').format(250_000)} so'm)`);
  assert.match(orderPricing.formatOrderTotal({ total_price: 250_000, price_on_request: true, items: [fixed] }, 'ru-RU'), /^Hisob-kitobdan/);
});

function makeRouter() {
  const routes = [];
  const router = {};
  for (const method of ['get', 'post', 'patch', 'delete']) {
    router[method] = (path, ...handlers) => routes.push({ method, path, handler: handlers.at(-1) });
  }
  return { router, routes };
}

test('every custom-order request requires a quote and keeps server-derived numeric contracts', async () => {
  for (const prices of [[125_000], [0], [null], [125_000, 0], [125_000, -50_000]]) {
    const { router, routes } = makeRouter();
    const notifications = [];
    let saved;
    const products = prices.map((price, index) => ({ id: `product-${index}`, nameUz: `Item ${index}`, price, isActive: true }));
    const prisma = {
      product: { findMany: async () => products },
      order: { findUnique: async () => ({ ...saved, items: saved.items.createMany.data }) },
      $transaction: async (callback) => callback({
        customer: { upsert: async () => ({ id: 'customer' }) },
        order: { create: async ({ data }) => { saved = data; return data; } },
      }),
    };
    const passthrough = (handler) => handler;
    loadBackend('routes/orders.routes.ts', {
      express: { Router: () => router }, zod: { z }, '@prisma/client': { Prisma: { JsonNull: null } },
      '../db': { prisma },
      '../middleware/optionalAuth': { optionalAuth: passthrough },
      '../middleware/requireAuth': { requireAuth: passthrough },
      '../middleware/requirePermission': { requirePermission: () => passthrough },
      '../middleware/errorHandler': { asyncHandler: passthrough },
      '../lib/ApiError': { ApiError: Error },
      '../lib/orderNumber': { nextOrderNumber: async () => 'TEST-001' },
      '../lib/amocrm': { createAmoLead: async (_type, data) => notifications.push(data) },
      '../lib/telegram': { sendOrderNotification: async (data) => notifications.push(data) },
      '@shared/pricing': pricing,
    });
    let response;
    await routes.find((route) => route.method === 'post' && route.path === '/').handler({
      body: {
        customer_name: 'Test Customer', customer_phone: '+998900000000',
        price_on_request: false, total_price: 1,
        items: products.map((product) => ({ product_id: product.id, quantity: 2, price: 1 })),
      },
    }, { json: (data) => { response = data; } });
    const expectedTotal = prices.reduce((sum, price) => sum + (pricing.hasFixedPrice(price) ? price : 0) * 2, 0);
    const requiresQuote = true;
    assert.equal(saved.totalPrice, expectedTotal);
    assert.equal(response.total_price, expectedTotal);
    assert.equal(response.price_on_request, requiresQuote);
    assert.equal(notifications.length, 2);
    // Legacy orders may contain null snapshots; a manual resend must still
    // describe them as a quote without changing the numeric integration shape.
    if (prices[0] === null) {
      saved.totalPrice = null;
      saved.items.createMany.data[0].priceSnapshot = null;
    }
    await routes.find((route) => route.method === 'post' && route.path === '/:id/notify-telegram').handler({
      params: { id: 'order' }, body: {},
    }, { json() {} });
    assert.equal(notifications.length, 3);
    for (const notification of notifications) {
      assert.equal(notification.total_price, expectedTotal);
      assert.equal(notification.price_on_request, requiresQuote);
      notification.items.forEach((item, index) => {
        assert.equal(typeof item.price, 'number');
        assert.equal(item.price_on_request, true);
      });
    }
  }
});

test('crawler never advertises catalogue samples as ready-stock offers', async () => {
  for (const price of [0, null, 125_000]) {
    const { router, routes } = makeRouter();
    loadBackend('routes/prerender.routes.ts', {
      express: { Router: () => router },
      '../db': { prisma: {
        systemSettings: { findFirst: async () => ({ primaryDomain: 'https://example.test', siteName: 'Test' }) },
        product: { findUnique: async () => ({
          id: 'product', slug: 'wardrobe', nameUz: 'Wardrobe', price,
          isActive: true, isIndexed: true, isFollowed: true, inStock: true, images: [],
        }) },
      } },
      '../middleware/errorHandler': { asyncHandler: (handler) => handler },
      '@shared/faqData': { faqs: [] }, '@shared/pageSeo': { getPageSeo: () => ({}) },
      '@shared/pricing': pricing,
    });
    let html;
    await routes[0].handler({ params: { 0: 'product/wardrobe' } }, {
      type() {}, send(value) { html = value; },
    });
    const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal('offers' in jsonLd, false);
    assert.match(html, /Narx hisob-kitobdan so'ng aniqlanadi/);
    assert.doesNotMatch(html, /Narxi: 0/);
  }
});
