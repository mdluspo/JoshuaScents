export interface WishlistSnapshot { ids: number[]; ready: boolean; busy: boolean; error: string; userId: string | null }
export interface WishlistAdapter {
  readGuest: () => string | null; writeGuest: (value: string) => void;
  fetchIds: (userId: string) => Promise<number[]>;
  addIds: (userId: string, ids: number[]) => Promise<void>;
  removeId: (userId: string, id: number) => Promise<void>;
}
export const WISHLIST_KEY = "joshua-scents-wishlist:v1";
export function normalizeWishlist(value: unknown): number[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0))].slice(0, 100) : [];
}
export function parseWishlist(raw: string | null): number[] {
  if (!raw || raw.length > 4000) return [];
  try { const parsed = JSON.parse(raw); return normalizeWishlist(parsed?.version === 1 ? parsed.ids : []); } catch { return []; }
}
export const serializeWishlist = (ids: number[]) => JSON.stringify({ version: 1, ids: normalizeWishlist(ids) });

// Only known diagnostic codes are displayed. Provider messages/details can
// contain row contents, account identifiers or request headers.
export function wishlistFailureMessage(error: unknown, operation: "sync" | "write") {
  const value = error && typeof error === "object" ? error as { code?: unknown; status?: unknown; name?: unknown } : {};
  const code = typeof value.code === "string" ? value.code : "";
  const prefix = operation === "sync" ? "Your account wishlist could not sync." : "The wishlist change could not be saved.";
  let reason: string;
  if (["PGRST205", "42P01", "PGRST204"].includes(code)) {
    reason = `Account wishlist database setup is incomplete. The store owner needs to check the account migrations. (${code})`;
  } else if (code === "42501" || value.status === 403) {
    reason = "Account wishlist access was denied. The store owner needs to check database permissions. (WISHLIST_ACCESS)";
  } else if (["PGRST301", "PGRST302", "PGRST303"].includes(code) || value.status === 401) {
    reason = "Your session was rejected. Sign out and sign in again, then retry. (WISHLIST_SESSION)";
  } else if (code === "23503") {
    reason = "The account or fragrance is missing from the database. The store owner needs to check the account and catalogue setup. (WISHLIST_REFERENCE)";
  } else if (value.name === "AbortError" || value.name === "TimeoutError") {
    reason = "The account service took too long to respond. Please retry. (WISHLIST_TIMEOUT)";
  } else {
    reason = "The account service could not complete the request. Check your connection and retry. (WISHLIST_REQUEST)";
  }
  return `${prefix} ${reason}`;
}

export function createWishlistStore(adapter: WishlistAdapter) {
  let state: WishlistSnapshot = { ids: [], ready: false, busy: false, error: "", userId: null };
  let generation = 0;
  let queue = Promise.resolve();
  let allowedIds: Set<number> | null = null;
  const listeners = new Set<() => void>();
  const valid = (ids: number[]) => normalizeWishlist(ids).filter(id => !allowedIds || allowedIds.has(id));
  const emit = (patch: Partial<WishlistSnapshot>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  const guest = () => { try { return valid(parseWishlist(adapter.readGuest())); } catch { return []; } };
  const persist = (ids: number[]) => { try { adapter.writeGuest(serializeWishlist(ids)); return true; } catch { return false; } };
  async function setUser(userId: string | null) {
    const current = ++generation;
    emit({ userId, ids: [], ready: false, busy: true, error: "" });
    if (!userId) { emit({ ids: guest(), ready: true, busy: false }); return; }
    let saved: number[] = [];
    try {
      saved = valid(await adapter.fetchIds(userId));
      if (current !== generation) return;
      const local = guest();
      const missing = local.filter(id => !saved.includes(id)).slice(0, Math.max(0, 100 - saved.length));
      if (missing.length) await adapter.addIds(userId, missing);
      if (current !== generation) return;
      const combined = valid([...saved, ...missing]);
      const leftover = local.filter(id => !combined.includes(id));
      const cleared = persist(leftover);
      emit({ ids: combined, ready: true, busy: false, error: !cleared ? "Your account wishlist is saved, but this browser could not update its guest list." : leftover.length ? "Your account wishlist is full. Extra guest saves remain on this device." : "" });
    } catch (error) { if (current === generation) emit({ ids: saved, ready: true, busy: false, error: wishlistFailureMessage(error, "sync") + (guest().length ? " Guest saves remain on this device." : "") }); }
  }
  function toggle(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0 || (allowedIds && !allowedIds.has(id))) return Promise.resolve();
    const current = generation;
    const userId = state.userId;
    queue = queue.catch(() => {}).then(async () => {
      if (current !== generation || !state.ready) return;
      const before = state.ids;
      const removing = before.includes(id);
      if (!removing && before.length >= 100) { emit({ error: "Your wishlist holds up to 100 fragrances. Remove one before adding another." }); return; }
      const next = removing ? before.filter(item => item !== id) : [...before, id];
      emit({ ids: next, busy: true, error: "" });
      if (!userId) { const saved = persist(next); emit({ busy: false, error: saved ? "" : "Saved for this session only: browser storage is unavailable." }); return; }
      try {
        if (removing) await adapter.removeId(userId, id); else await adapter.addIds(userId, [id]);
        if (current === generation) emit({ busy: false });
      } catch (error) { if (current === generation) emit({ ids: before, busy: false, error: wishlistFailureMessage(error, "write") }); }
    });
    return queue;
  }
  return { getSnapshot: () => state, subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setUser, toggle, reloadGuest: () => { if (!state.userId) emit({ ids: guest(), ready: true }); },
    setCatalog: (ids: number[]) => { allowedIds = new Set(ids.filter(id => Number.isSafeInteger(id) && id > 0)); const filtered = valid(state.ids); if (filtered.length !== state.ids.length) emit({ ids: filtered }); } };
}
