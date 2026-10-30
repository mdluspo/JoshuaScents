import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApi, mockRequest, mockResponse } from './helpers/api-harness.mjs';
const { module: { rankFragrances } } = loadApi('src/lib/fragrance-search.ts');
const { module: { FRAGRANCE_CATALOG: products } } = loadApi('src/lib/fragrance-catalog.ts');
const { module: { recommendScents, parseScentDescription, preferencesFromPrompt, EMPTY_SCENT } } = loadApi('src/lib/scent-matching.ts');
const ids = result => Array.from(result, item => item.id ?? item.productId);
const preferences = input => ({ ...EMPTY_SCENT, likes: [], avoids: [], ...input });

test('search finds names, notes, families, brands and single-letter fragrance names', () => {
  assert.equal(rankFragrances(products, 'Y')[0].id, 4);
  assert.equal(rankFragrances(products, 'Bleu de Chanel')[0].id, 1);
  assert.deepEqual(ids(rankFragrances(products, 'vanilla')).sort((a, b) => a - b), [7, 11]);
  assert.ok(ids(rankFragrances(products, 'golden vanilla')).includes(8));
  assert.ok(ids(rankFragrances(products, 'woody')).includes(5));
  assert.ok(ids(rankFragrances(products, 'JEM')).includes(6));
  assert.ok(ids(rankFragrances(products, 'iris')).includes(10));
});
test('search handles accents, apostrophes, token order and conservative typos', () => {
  assert.equal(rankFragrances(products, 'hermes terre')[0].id, 12);
  assert.equal(rankFragrances(products, "l'homme nuit")[0].id, 6);
  assert.equal(rankFragrances(products, 'sauvauge')[0].id, 2);
  assert.equal(rankFragrances(products, 'baccraat')[0].id, 9);
  assert.equal(rankFragrances(products, 'nonexistent unicorn').length, 0);
  assert.equal(rankFragrances(products, '').length, 0);
  assert.equal(rankFragrances(products, '<script>alert(1)</script>').length, 0);
});
test('API and browser search agree on results, relevance and catalogue prices', () => {
  const { module: route } = loadApi('api/products/search.ts');
  for (const q of ['vanilla', 'Y', 'wood', 'sauvauge', 'Hermès', 'JEM', 'citrus']) {
    const response = mockResponse(); route.default(mockRequest({ method: 'GET', query: { q } }), response);
    assert.equal(response.statusCode, 200); assert.deepEqual(ids(response.body.products), ids(rankFragrances(products, q)));
  }
  const { module: { priceCart } } = loadApi('api/_lib/catalog.ts');
  assert.equal(priceCart([{ productId: 1, size: '5ml', quantity: 2 }])[0].lineTotal, 96000);
});
test('scent parsing respects dislikes, lists and contrast clauses', () => {
  const parsed = parseScentDescription('Citrus and woods for humid days, but no vanilla, oud or smoke.');
  assert.ok(parsed.likes.includes('fresh')); assert.ok(parsed.likes.includes('woody'));
  assert.ok(parsed.avoids.includes('vanilla')); assert.ok(parsed.avoids.includes('oud'));
  assert.ok(parsed.avoids.includes('smoky'));
  const specific = parseScentDescription('I like sweet scents but not vanilla');
  assert.ok(specific.likes.includes('sweet')); assert.ok(!specific.avoids.includes('sweet'));
});
test('scent matches respect hard exclusions and budget without arbitrary filler', () => {
  const matches = recommendScents(products, preferences({ description: 'Clean citrus and woods for humid office days, but no vanilla or smoke', maxPrice: '300' }));
  assert.ok(matches.length > 0); assert.ok(matches.length <= 3);
  for (const match of matches) {
    const product = products.find(product => product.id === match.productId);
    assert.ok(product.price <= 300); assert.doesNotMatch(product.description.toLowerCase(), /vanilla|smoke/);
    assert.match(match.reason, /listed|profile/);
  }
  assert.equal(recommendScents(products, preferences({ likes: ['vanilla'], avoids: ['vanilla'], maxPrice: '100' })).length, 0);
  assert.equal(recommendScents(products, preferences({ description: 'unicorn spaceship' })).length, 0);
  assert.equal(recommendScents(products, preferences({ likes: ['woody'], maxPrice: '-1' })).length, 0);
});
test('explicit character exclusions win and matches are unique', () => {
  const matches = recommendScents(products, preferences({ likes: ['fresh'], avoids: ['sweet'], climate: 'warm' }));
  assert.ok(matches.length); assert.equal(new Set(ids(matches)).size, matches.length);
  assert.ok(!ids(matches).includes(7)); assert.ok(!ids(matches).includes(11));
  const onlyOud = recommendScents(products, preferences({ description: 'I want oud, but not vanilla or smoke' }));
  assert.deepEqual(ids(onlyOud), [5]);
});

test('specific-note alternatives and less-sweet requests are not inverted', () => {
  const alternatives = recommendScents(products, preferences({ description: 'I like iris or vanilla' }));
  assert.ok(ids(alternatives).includes(10)); assert.ok(ids(alternatives).some(id => [7, 11].includes(id)));
  assert.ok(parseScentDescription('I want something less sweet').avoids.includes('sweet'));
  const withoutIris = recommendScents(products, preferences({ description: 'I like floral scents but no iris' }));
  assert.ok(withoutIris.length); assert.ok(!ids(withoutIris).includes(10));
});

test('a single prompt carries budget and everyday context into its edit', () => {
  const brief = preferencesFromPrompt(preferences({ description: 'Clean woody scents for everyday wear, under PHP 300, no vanilla.' }));
  assert.equal(brief.maxPrice, '300'); assert.equal(brief.occasion, 'everyday');
  const matches = recommendScents(products, brief);
  assert.ok(matches.length); assert.ok(matches.every(match => products.find(product => product.id === match.productId).price <= 300));
  assert.equal(preferencesFromPrompt(preferences({ description: 'A woody scent in a 5ml bottle' })).maxPrice, '');
  assert.equal(preferencesFromPrompt(preferences({ description: 'Vanilla under 500', maxPrice: '450' })).maxPrice, '450');
});

test('budget wording no more than is not interpreted as a disliked note', () => {
  const brief = preferencesFromPrompt(preferences({ description: 'Vanilla, no more than PHP 1,000' }));
  assert.equal(brief.maxPrice, '1000');
  assert.ok(!parseScentDescription(brief.description).avoids.includes('vanilla'));
  assert.deepEqual(ids(recommendScents(products, brief)).sort((a, b) => a - b), [7, 11]);
});
