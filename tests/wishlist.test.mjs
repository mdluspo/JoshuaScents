import test from 'node:test';
import assert from 'node:assert/strict';
import { createWishlistStore, normalizeWishlist, parseWishlist, serializeWishlist, wishlistFailureMessage } from '../src/lib/wishlist-core.ts';

function fixture(initial = [], options = {}) {
  let local = serializeWishlist(initial);
  const accounts = new Map([['alice', [2]], ['bob', [8]]]);
  const writes = [];
  const adapter = { readGuest: () => local, writeGuest: value => { local = value; }, fetchIds: async id => accounts.get(id) ?? [], addIds: async (user, ids) => { writes.push({ user, ids }); accounts.set(user, [...new Set([...(accounts.get(user) ?? []), ...ids])]); }, removeId: async (user, id) => { accounts.set(user, (accounts.get(user) ?? []).filter(value => value !== id)); }, ...options };
  const store = createWishlistStore(adapter);
  return { store, accounts, writes, local: () => parseWishlist(local), adapter };
}
test('wishlist parser rejects corrupt storage and invalid/oversized identifiers', () => {
  assert.deepEqual(parseWishlist('not JSON'), []); assert.deepEqual(parseWishlist('{"version":2,"ids":[1]}'), []);
  assert.deepEqual(normalizeWishlist([1, 1, '2', -1, 3.2, 2, Infinity]), [1, 2]);
  assert.equal(normalizeWishlist(Array.from({ length: 200 }, (_, i) => i + 1)).length, 100);
  assert.deepEqual(parseWishlist('x'.repeat(5000)), []);
});
test('guests can save, refresh and remove without an account', async () => {
  const { store, local } = fixture(); await store.setUser(null); await store.toggle(1);
  assert.deepEqual(store.getSnapshot().ids, [1]); assert.deepEqual(local(), [1]);
  store.reloadGuest(); assert.deepEqual(store.getSnapshot().ids, [1]);
  await store.toggle(1); assert.deepEqual(store.getSnapshot().ids, []); assert.deepEqual(local(), []);
});
test('all subscribers receive one consistent saved state', async () => {
  const { store } = fixture(); await store.setUser(null); const first = [], second = [];
  const off = store.subscribe(() => first.push(store.getSnapshot().ids.join(','))); store.subscribe(() => second.push(store.getSnapshot().ids.join(',')));
  await store.toggle(4); assert.equal(first.at(-1), '4'); assert.equal(second.at(-1), '4'); off();
});
test('guest saves merge with existing account favorites once and are not duplicated', async () => {
  const { store, accounts, local, writes } = fixture([1, 2]); await store.setUser('alice');
  assert.deepEqual(store.getSnapshot().ids, [2, 1]); assert.deepEqual(accounts.get('alice'), [2, 1]); assert.deepEqual(local(), []);
  await store.setUser('alice'); assert.equal(writes.length, 1);
});
test('signout and account switches never expose the previous account wishlist', async () => {
  const { store } = fixture([1]); await store.setUser('alice'); await store.setUser(null);
  assert.deepEqual(store.getSnapshot().ids, []); await store.setUser('bob'); assert.deepEqual(store.getSnapshot().ids, [8]);
});
test('stale account reads are ignored after a session changes', async () => {
  let resolveAlice;
  const { store } = fixture([], { fetchIds: user => user === 'alice' ? new Promise(resolve => { resolveAlice = resolve; }) : Promise.resolve([8]) });
  const pending = store.setUser('alice'); await store.setUser('bob'); resolveAlice([2]); await pending;
  assert.deepEqual(store.getSnapshot().ids, [8]); assert.equal(store.getSnapshot().userId, 'bob');
});
test('failed account writes roll back and surface an error', async () => {
  const { store } = fixture([], { addIds: async () => { throw new Error('offline'); } }); await store.setUser('alice'); await store.toggle(3);
  assert.deepEqual(store.getSnapshot().ids, [2]); assert.match(store.getSnapshot().error, /could not be saved/); assert.equal(store.getSnapshot().busy, false);
});
test('queued rapid toggles are serialized instead of losing updates', async () => {
  const { store, accounts } = fixture(); await store.setUser('alice'); await Promise.all([store.toggle(3), store.toggle(4), store.toggle(3)]);
  assert.deepEqual(store.getSnapshot().ids, [2, 4]); assert.deepEqual(accounts.get('alice'), [2, 4]);
});
test('blocked browser storage retains session saves with honest feedback', async () => {
  const { store } = fixture([], { writeGuest: () => { throw new Error('blocked'); } }); await store.setUser(null); await store.toggle(1);
  assert.deepEqual(store.getSnapshot().ids, [1]); assert.match(store.getSnapshot().error, /session only/);
});
test('catalog constraints discard injected product identifiers', async () => {
  const { store } = fixture([1, 999]); store.setCatalog([1, 2]); await store.setUser(null); await store.toggle(999);
  assert.deepEqual(store.getSnapshot().ids, [1]);
});
test('full account wishlists keep excess guest saves instead of discarding them', async () => {
  const full = Array.from({ length: 100 }, (_, i) => i + 1);
  const { store, local } = fixture([101], { fetchIds: async () => full }); await store.setUser('alice');
  assert.equal(store.getSnapshot().ids.length, 100); assert.deepEqual(local(), [101]); assert.match(store.getSnapshot().error, /full/);
});

test('wishlist diagnostics distinguish setup, permission, session and reference errors', () => {
  for (const code of ['PGRST205', '42P01', 'PGRST204']) assert.match(wishlistFailureMessage({ code }, 'sync'), /database setup is incomplete/);
  assert.match(wishlistFailureMessage({ code: '42501' }, 'write'), /WISHLIST_ACCESS/);
  assert.match(wishlistFailureMessage({ status: 403 }, 'write'), /WISHLIST_ACCESS/);
  for (const code of ['PGRST301', 'PGRST302', 'PGRST303']) assert.match(wishlistFailureMessage({ code }, 'sync'), /WISHLIST_SESSION/);
  assert.match(wishlistFailureMessage({ code: '23503' }, 'write'), /WISHLIST_REFERENCE/);
  assert.match(wishlistFailureMessage({ name: 'AbortError' }, 'sync'), /WISHLIST_TIMEOUT/);
});

test('wishlist feedback never exposes arbitrary provider messages, hints or codes', () => {
  const message = wishlistFailureMessage({ code: '<secret>', message: 'private@example.com', details: 'Bearer private-token', hint: '<script>' }, 'write');
  assert.match(message, /WISHLIST_REQUEST/);
  assert.doesNotMatch(message, /private|secret|Bearer|script/);
});

test('failed account merges retain guest saves and give an actionable diagnostic', async () => {
  const { store, local } = fixture([1], { addIds: async () => { throw { code: '42501' }; } });
  await store.setUser('alice');
  assert.deepEqual(store.getSnapshot().ids, [2]); assert.deepEqual(local(), [1]);
  assert.match(store.getSnapshot().error, /WISHLIST_ACCESS/);
  assert.match(store.getSnapshot().error, /Guest saves remain/);
});

test('retry after a setup failure loads the account and merges retained guest saves', async () => {
  let unavailable = true;
  const { store, local, accounts } = fixture([1], { fetchIds: async () => { if (unavailable) throw { code: 'PGRST205' }; return [2]; } });
  await store.setUser('alice'); assert.match(store.getSnapshot().error, /PGRST205/); assert.deepEqual(local(), [1]);
  unavailable = false; await store.setUser('alice');
  assert.deepEqual(accounts.get('alice'), [2, 1]); assert.deepEqual(local(), []); assert.equal(store.getSnapshot().error, '');
});
