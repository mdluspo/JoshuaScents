import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApi } from './helpers/api-harness.mjs';
const { module: catalog } = loadApi('src/lib/catalog.ts');
// The harness isolates module globals in a VM. Bring returned values back to
// this realm so strict assertions compare data rather than VM prototypes.
const { EMPTY_CATALOG, catalogFacets, catalogFromSearch, catalogPrice, catalogUrl, normalizeCatalog, priceError, selectCatalog } = Object.fromEntries(Object.entries(catalog).map(([key, value]) => [key, typeof value === 'function' ? (...args) => structuredClone(value(...args)) : structuredClone(value)]));

const product = (id, name, family, category, brand, price, bestSeller, largePrice = price * 3) => ({ id, name, family, category, brand, price, bestSeller, notes: family === 'Woody' ? 'Woody · Citrus' : 'Fresh · Floral', sizes: [{ label: '2ml', price }, { label: '10ml', price: largePrice }], img: '', description: '' });
const products = [product(1, 'Amber', 'Woody', 'EVENING', 'House A', 200, false, 900), product(2, 'Zest', 'Fresh', 'DAY', 'House B', 500, true, 700), product(3, 'Iris', 'Fresh', 'EVENING', 'House A', 300, true, 1100), product(4, 'Terre d’Hermès', 'Woody', 'DAY', 'House C', 400, false, 800)];
const state = overrides => ({ ...EMPTY_CATALOG, ...overrides });
const ids = filters => Array.from(selectCatalog(products, state(filters)), p => p.id);

test('multiple options are OR within a group; groups combine with AND', () => {
  assert.deepEqual(ids({ categories: ['DAY', 'EVENING'], families: ['Fresh'], brands: ['House A'] }), [3]);
  assert.deepEqual(ids({ categories: ['DAY', 'EVENING'] }), [1, 2, 3, 4]);
});
test('all sorting modes have deterministic and meaningful ordering', () => {
  assert.deepEqual(ids({ sort: 'featured' }), [1, 2, 3, 4]);
  assert.deepEqual(ids({ sort: 'bestsellers' }), [2, 3, 1, 4]);
  assert.deepEqual(ids({ sort: 'price-asc' }), [1, 3, 4, 2]);
  assert.deepEqual(ids({ sort: 'price-desc' }), [2, 4, 3, 1]);
  assert.deepEqual(ids({ sort: 'name-asc' }), [1, 3, 4, 2]);
  assert.deepEqual(ids({ sort: 'name-desc' }), [2, 4, 3, 1]);
});
test('selected size controls both filtering and price sorting', () => {
  assert.deepEqual(ids({ size: '10ml', sort: 'price-asc' }), [2, 4, 1, 3]);
  assert.deepEqual(ids({ size: '10ml', minPrice: '750', maxPrice: '950' }), [1, 4]);
  assert.equal(catalogPrice(products[0], '10ml'), 900);
  assert.deepEqual(ids({ size: '50ml' }), []);
});
test('bestseller toggle and price bounds work, including a zero maximum', () => {
  assert.deepEqual(ids({ bestSellers: true, maxPrice: '350' }), [3]);
  assert.deepEqual(ids({ maxPrice: '0' }), []);
  assert.deepEqual(ids({ minPrice: '300', maxPrice: '400' }), [3, 4]);
});
test('invalid price ranges show an error and are not silently applied', () => {
  assert.ok(priceError(state({ minPrice: '400', maxPrice: '100' })));
  assert.ok(priceError(state({ minPrice: '-1' })));
  assert.ok(priceError(state({ minPrice: 'NaN' })));
  assert.deepEqual(ids({ minPrice: '400', maxPrice: '100', families: ['Fresh'] }), [2, 3]);
});
test('facet counts exclude their own group and include all other filters', () => {
  const counts = catalogFacets(products, state({ categories: ['DAY'], families: ['Fresh'] }), 'categories');
  assert.deepEqual(counts, [{ value: 'DAY', count: 1 }, { value: 'EVENING', count: 1 }]);
  const brands = catalogFacets(products, state({ families: ['Fresh'] }), 'brands');
  assert.equal(brands.find(option => option.value === 'House C').count, 0);
});
test('search supports names, notes, brands, multiple terms and diacritics', () => {
  assert.deepEqual(ids({ query: 'hermes' }), [4]);
  assert.deepEqual(ids({ query: 'house a fresh' }), [3]);
  assert.deepEqual(ids({ query: 'woody citrus' }), [1, 4]);
  assert.deepEqual(ids({ query: 'not-in-catalog' }), []);
});
test('collection URLs round-trip selected filters and preserve unrelated parameters', () => {
  const selected = state({ categories: ['DAY', 'EVENING'], families: ['Woody'], brands: ['House A'], query: 'amber', size: '10ml', sort: 'price-desc', bestSellers: true, minPrice: '100', maxPrice: '950' });
  const url = catalogUrl('https://example.test/?campaign=silk#old', selected);
  const parsed = new URL(url, 'https://example.test');
  assert.equal(parsed.searchParams.get('view'), 'collections');
  assert.equal(parsed.searchParams.get('campaign'), 'silk');
  assert.deepEqual(catalogFromSearch(parsed.search), selected);
  assert.equal(catalogUrl(parsed.href, null), '/?campaign=silk');
});
test('untrusted URL input is normalized without changing catalog prices', () => {
  assert.equal(catalogFromSearch('?sort=invalid&min=-4&max=Infinity').sort, 'featured');
  assert.equal(catalogFromSearch('?min=-4').minPrice, '');
  assert.deepEqual(normalizeCatalog({ brands: ['All Brands', 'House A', 'House A'] }).brands, ['House A']);
  assert.equal(new URL(catalogUrl('https://example.test/', state({ minPrice: '600', maxPrice: '10' })), 'https://example.test').searchParams.has('min'), false);
});
