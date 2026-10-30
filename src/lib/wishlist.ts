import { useSyncExternalStore } from "react";
import { getSupabase } from "./supabase";
import { createWishlistStore, WISHLIST_KEY } from "./wishlist-core";

const store = createWishlistStore({
  readGuest: () => localStorage.getItem(WISHLIST_KEY),
  writeGuest: value => localStorage.setItem(WISHLIST_KEY, value),
  fetchIds: async userId => { const db = getSupabase(); if (!db) throw new Error("Account service unavailable"); const { data, error } = await db.from("favorites").select("product_id").eq("user_id", userId).limit(100); if (error) throw error; return (data ?? []).map(row => row.product_id); },
  addIds: async (userId, ids) => { const db = getSupabase(); if (!db) throw new Error("Account service unavailable"); const { error } = await db.from("favorites").upsert(ids.map(id => ({ user_id: userId, product_id: id })), { onConflict: "user_id,product_id", ignoreDuplicates: true }); if (error) throw error; },
  removeId: async (userId, id) => { const db = getSupabase(); if (!db) throw new Error("Account service unavailable"); const { error } = await db.from("favorites").delete().eq("user_id", userId).eq("product_id", id); if (error) throw error; },
});
let initialized = false;
let authVersion = 0;
async function refresh() {
  const current = ++authVersion;
  try { const userId = (await getSupabase()?.auth.getSession())?.data.session?.user.id ?? null; if (current === authVersion) await store.setUser(userId); }
  catch { if (current === authVersion) await store.setUser(null); }
}
function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  store.reloadGuest();
  void refresh();
  const db = getSupabase();
  db?.auth.onAuthStateChange((_event, session) => {
    const current = ++authVersion;
    // Clear immediately on account changes; defer database work outside the
    // Supabase auth callback lock to prevent a session/query deadlock.
    if (!session?.user) void store.setUser(null);
    else { void store.setUser(null); window.setTimeout(() => { if (current === authVersion) void store.setUser(session.user.id); }, 0); }
  });
  window.addEventListener("storage", event => { if (event.key === WISHLIST_KEY || event.key === null) store.reloadGuest(); });
}
const serverSnapshot = { ids: [] as number[], ready: false, busy: false, error: "", userId: null };
export function useWishlist() {
  const state = useSyncExternalStore(listener => { initialize(); return store.subscribe(listener); }, store.getSnapshot, () => serverSnapshot);
  return { ...state, count: state.ids.length, toggle: store.toggle, retry: refresh };
}
export const configureWishlistCatalog = store.setCatalog;
