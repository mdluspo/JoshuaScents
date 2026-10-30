import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { loadApi, mockRequest, mockResponse } from './helpers/api-harness.mjs';

test('API guard rejects cross-site and opaque origins; permits configured and local origins', () => {
  const { module: api } = loadApi('api/_lib/http.ts', { env: { APP_ORIGIN: 'https://store.example' } });
  assert.throws(() => api.allowMethods(mockRequest({ headers: { origin: 'https://evil.example', 'content-type': 'application/json' } }), mockResponse(), ['POST']), { status: 403 });
  assert.throws(() => api.checkOrigin(mockRequest({ headers: { origin: 'null' } })), { status: 403 });
  assert.throws(() => api.checkOrigin(mockRequest({ headers: { 'sec-fetch-site': 'cross-site' } })), { status: 403 });
  assert.doesNotThrow(() => api.checkOrigin(mockRequest({ headers: { origin: 'https://store.example' } })));
  assert.doesNotThrow(() => api.checkOrigin(mockRequest({ headers: { origin: 'http://localhost:5173', host: 'localhost:5173' } })));
});
test('API guard enforces methods, JSON object content and bounded payloads', () => {
  const { module: api } = loadApi('api/_lib/http.ts');
  assert.throws(() => api.allowMethods(mockRequest({ method: 'DELETE' }), mockResponse(), ['POST']), { status: 405 });
  assert.throws(() => api.allowMethods(mockRequest({ headers: { 'content-type': 'text/plain' } }), mockResponse(), ['POST']), { status: 415 });
  for (const body of [null, [], 'not-json']) assert.throws(() => api.allowMethods(mockRequest({ body }), mockResponse(), ['POST']), { status: 400 });
  assert.throws(() => api.allowMethods(mockRequest({ body: { text: 'x'.repeat(25000) } }), mockResponse(), ['POST']), { status: 413 });
  assert.throws(() => api.allowMethods(mockRequest({ headers: { 'content-type': 'application/json', 'content-length': '9999999' } }), mockResponse(), ['POST']), { status: 413 });
});
test('rate limits return retry guidance and reset after their window', () => {
  const { module: api } = loadApi('api/_lib/http.ts');
  const req = mockRequest(), res = mockResponse();
  api.rateLimit(req, res, '/test-limit', 2, 1000); api.rateLimit(req, res, '/test-limit', 2, 1000);
  assert.throws(() => api.rateLimit(req, res, '/test-limit', 2, 1000), { status: 429 });
  assert.equal(res.headers['retry-after'], '60');
  assert.doesNotThrow(() => api.rateLimit(req, res, '/test-limit', 2, 61001));
});
test('local client-supplied forwarding headers cannot evade rate limits', () => {
  const { module: api } = loadApi('api/_lib/http.ts');
  api.rateLimit(mockRequest({ headers: { 'x-forwarded-for': '1.1.1.1' } }), mockResponse(), '/spoof-test', 1, 0);
  assert.throws(() => api.rateLimit(mockRequest({ headers: { 'x-forwarded-for': '2.2.2.2' } }), mockResponse(), '/spoof-test', 1, 0), { status: 429 });
});
test('errors do not disclose provider payloads, database details or config names', () => {
  const { module: api } = loadApi('api/_lib/http.ts');
  const res = mockResponse(); api.handleApiError(res, new api.ApiError(502, 'Unavailable', { secret: 'do-not-expose' }));
  assert.equal(res.body.error, 'Unavailable'); assert.ok(res.body.requestId); assert.equal(res.body.details, undefined);
  assert.ok(!JSON.stringify(res.body).includes('do-not-expose'));
  assert.throws(() => api.requiredEnv('SECRET_TEST_KEY'), error => error.status === 503 && !error.message.includes('SECRET_TEST_KEY'));
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});
test('plain text rejects markup/control characters but preserves quotes and SQL-looking data', () => {
  const { module: rules } = loadApi('api/_lib/validation.ts');
  for (const value of ['<img src=x onerror=alert(1)>', '<script>alert(1)</script>', 'a\u0000b']) assert.equal(rules.plainText(1, 100).safeParse(value).success, false);
  for (const value of ["O’Connor", "Robert'); DROP TABLE profiles;--", 'José']) assert.equal(rules.plainText(1, 100).safeParse(value).success, true);
  assert.equal(rules.latitude.safeParse(91).success, false); assert.equal(rules.longitude.safeParse(-181).success, false);
  assert.equal(rules.httpsUrl.safeParse('javascript:alert(1)').success, false); assert.equal(rules.httpsUrl.safeParse('https://safe.example/track').success, true);
});
test('checkout and payment helpers are disabled by default without contacting providers', async () => {
  const { module: checkout } = loadApi('api/checkout.ts');
  const res = mockResponse(); await checkout.default(mockRequest({ url: '/api/checkout' }), res);
  assert.equal(res.statusCode, 503); assert.match(res.body.error, /preview-only/);
  const { module: payment } = loadApi('api/_lib/paymongo.ts');
  await assert.rejects(payment.createPayMongoCheckout({}), { status: 503 });
  const { module: webhook } = loadApi('api/webhooks/paymongo.ts'); const hookRes = mockResponse();
  await webhook.default(mockRequest(), hookRes); assert.equal(hookRes.statusCode, 503);
});
test('admin bearer parsing rejects absent, malformed and oversized credentials', () => {
  const { module: auth } = loadApi('api/_lib/supabase.ts');
  for (const value of [undefined, 'Basic secret', 'Bearer not-a-jwt', 'Bearer a.b.c\r\nInjected: yes', 'Bearer ' + 'x'.repeat(9000)]) assert.throws(() => auth.bearerToken(value), { status: 401 });
  assert.equal(auth.bearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
});
test('admin authorization uses verified user and database role, never user metadata', async () => {
  for (const role of ['customer', 'admin']) {
    const fakeDb = { auth: { getUser: async () => ({ data: { user: { id: 'user-1', user_metadata: { role: 'admin' } } }, error: null }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role }, error: null }) }) }) }) };
    const { module: auth } = loadApi('api/_lib/supabase.ts', { env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture' }, overrides: { '@supabase/supabase-js': { createClient: () => fakeDb } } });
    if (role === 'admin') assert.equal((await auth.requireAdmin('Bearer abc.def.ghi')).id, 'user-1');
    else await assert.rejects(auth.requireAdmin('Bearer abc.def.ghi'), { status: 403 });
  }
});
test('admin endpoints fail closed for missing and customer permissions', async () => {
  for (const entry of ['api/admin/session.ts', 'api/admin/orders.ts']) {
    for (const status of [401, 403]) {
      const isolated = loadApi(entry, { overrides: { 'api/_lib/supabase.ts': { requireAdmin: async () => { const { ApiError } = isolated.load('api/_lib/http.ts'); throw new ApiError(status, 'Denied'); }, adminDb: () => { throw new Error('Database should not be reached'); } } } });
      const res = mockResponse(); await isolated.module.default(mockRequest({ method: 'GET', url: '/api/admin/test' }), res); assert.equal(res.statusCode, status);
    }
  }
});
test('fulfillment changes cannot set financial states or reverse final states', () => {
  const { module: orders } = loadApi('api/admin/orders.ts');
  assert.equal(orders.canTransitionOrder('paid', 'processing', 'paymongo'), true);
  assert.equal(orders.canTransitionOrder('processing', 'shipped', 'cod'), true);
  assert.equal(orders.canTransitionOrder('shipped', 'delivered', 'cod'), true);
  for (const [current, next, method] of [['pending_payment', 'paid', 'cod'], ['processing', 'refunded', 'paymongo'], ['delivered', 'processing', 'cod'], ['processing', 'cancelled', 'paymongo']]) assert.equal(orders.canTransitionOrder(current, next, method), false);
});
test('search handles SQL/XSS text as data and rejects unbounded query input', () => {
  const { module: search } = loadApi('api/products/search.ts');
  for (const q of ["' OR 1=1;--", '<script>alert(1)</script>']) { const res = mockResponse(); search.default(mockRequest({ method: 'GET', query: { q } }), res); assert.equal(res.statusCode, 200); assert.equal(res.body.products.length, 0); }
  const res = mockResponse(); search.default(mockRequest({ method: 'GET', query: { q: 'x'.repeat(201) } }), res); assert.equal(res.statusCode, 400);
});
test('email escapes customer-controlled HTML in its rendered output', async () => {
  let payload;
  const { module: email } = loadApi('api/_lib/email.ts', { env: { RESEND_API_KEY: 'fixture', EMAIL_FROM: 'test@example.test' }, fetch: async (_url, init) => { payload = JSON.parse(init.body); return new Response('{}', { status: 200 }); } });
  await email.sendOrderEmail({ reference: '<script>bad</script>', customer_name: '<img src=x onerror=bad>', customer_email: 'test@example.test', total_centavos: 100 });
  assert.ok(!payload.html.includes('<script>')); assert.ok(!payload.html.includes('<img')); assert.ok(payload.html.includes('&lt;img'));
});
test('webhook signatures reject nonnumeric timestamps and malformed digests', () => {
  const { module: payment } = loadApi('api/_lib/paymongo.ts', { env: { PAYMONGO_WEBHOOK_SECRET: 'fixture' } });
  assert.equal(payment.verifyPayMongoSignature('{}', 't=NaN,te=' + '0'.repeat(64)), false);
  assert.equal(payment.verifyPayMongoSignature('{}', 't=1,te=invalid'), false);
  const t = Math.floor(Date.now() / 1000).toString(); const digest = crypto.createHmac('sha256', 'fixture').update(`${t}.{}`).digest('hex');
  assert.equal(payment.verifyPayMongoSignature('{}', `t=${t},te=${digest}`), true);
});
test('deployment CSP blocks inline scripts, framing and plugin content', async () => {
  const config = JSON.parse(await fs.readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const csp = config.headers.find(rule => rule.source === '/(.*)').headers.find(header => header.key === 'Content-Security-Policy').value;
  assert.ok(csp.includes("script-src 'self'")); assert.ok(csp.includes("object-src 'none'")); assert.ok(csp.includes("frame-ancestors 'none'")); assert.ok(!csp.includes('unsafe-eval'));
});

test('admin status API rejects invalid IDs, financial status and mass assignment', async () => {
  const isolated = loadApi('api/admin/orders.ts', { overrides: { 'api/_lib/supabase.ts': { requireAdmin: async () => ({ id: 'admin' }), adminDb: () => ({ from() { throw new Error('Invalid input must not reach a query'); } }) } } });
  for (const body of [{ orderId: "' OR 1=1", status: 'processing' }, { orderId: '15bdc83c-572d-42f4-afdc-8fdf1b0f29f0', status: 'paid' }, { orderId: '15bdc83c-572d-42f4-afdc-8fdf1b0f29f0', status: 'processing', total_centavos: 0 }]) {
    const res = mockResponse(); await isolated.module.default(mockRequest({ method: 'PATCH', url: '/api/admin/orders', body }), res); assert.equal(res.statusCode, 400);
  }
});
test('address endpoints reject markup, unexpected keys and out-of-range coordinates', async () => {
  const { module: quote } = loadApi('api/delivery/quote.ts');
  for (const body of [{ address: '<script>alert(1)</script>', latitude: 14, longitude: 121 }, { address: 'A normal street', latitude: 200, longitude: 121 }, { address: 'A normal street', latitude: 14, longitude: 121, role: 'admin' }]) {
    const res = mockResponse(); await quote.default(mockRequest({ url: '/api/delivery/quote', body }), res); assert.equal(res.statusCode, 400);
  }
});
test('recommendations reject hostile reasons, duplicate IDs and unknown products', async () => {
  for (const recommendations of [ [{ productId: 1, reason: '<img src=x onerror=bad>' }, { productId: 2, reason: 'Fresh' }, { productId: 3, reason: 'Woody' }], [{ productId: 1, reason: 'Fresh' }, { productId: 1, reason: 'Fresh' }, { productId: 3, reason: 'Woody' }], [{ productId: 1, reason: 'Fresh' }, { productId: 2, reason: 'Fresh' }, { productId: 999, reason: 'Woody' }] ]) {
    const { module: advisor } = loadApi('api/ai/recommend.ts', { env: { OPENAI_API_KEY: 'fixture' }, fetch: async () => new Response(JSON.stringify({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ recommendations }) }] }] }), { status: 200, headers: { 'content-type': 'application/json' } }) });
    const res = mockResponse(); await advisor.default(mockRequest({ url: '/api/ai/recommend', body: { preference: 'A warm and woody fragrance' } }), res); assert.equal(res.statusCode, 502); assert.ok(!JSON.stringify(res.body).includes('<img'));
  }
});
test('public health response does not disclose integration configuration', async () => {
  const { module: health } = loadApi('api/health.ts', { env: { SUPABASE_SERVICE_ROLE_KEY: 'fixture' } });
  const res = mockResponse(); await health.default(mockRequest({ method: 'GET', url: '/api/health' }), res);
  assert.equal(res.body.ok, true); assert.equal(res.body.integrations, undefined); assert.equal(res.body.mode, 'prototype');
});
