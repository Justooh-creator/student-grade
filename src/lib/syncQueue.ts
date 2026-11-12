/**
 * Device-side outbox for learner edits. The queue lives in localStorage (per teacher and
 * school) so pending marks survive no-internet periods, failed requests, refreshes and restarts.
 * Only changes the server confirms are removed; retries are safe because the server treats an
 * operation whose value is already saved as done.
 */
import { acknowledge, emptyQueue, enqueue, toWire, type SyncQueue, type SyncResult, type WireChange } from "./syncMerge";
import type { Student } from "./store";

export const SYNC_CONFLICTS_EVENT = "edureport:sync-conflicts";

export interface KeyValueStore { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
export type SyncTransport = (changes: WireChange[]) => Promise<SyncResult[]>;

const memory = new Map<string, string>();
const memoryStore: KeyValueStore = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v), removeItem: (k) => void memory.delete(k) };
export function defaultStore(): KeyValueStore {
  try { if (typeof window !== "undefined" && window.localStorage) return window.localStorage; } catch { /* blocked */ }
  return memoryStore;
}

export const queueKey = (userId: string, schoolId: string) => `edureport-sync-queue-v1:${userId}:${schoolId}`;

export function readQueue(key: string, store: KeyValueStore = defaultStore()): SyncQueue {
  try {
    const q = JSON.parse(store.getItem(key) || "null") as SyncQueue | null;
    return q && typeof q.seq === "number" && q.students && typeof q.students === "object" ? q : emptyQueue();
  } catch { return emptyQueue(); }
}

export function writeQueue(key: string, q: SyncQueue, store: KeyValueStore = defaultStore()) {
  if (Object.keys(q.students).length === 0) store.removeItem(key);
  else store.setItem(key, JSON.stringify(q));
}

export function recordLocalChange(key: string, prev: Student[], next: Student[], store: KeyValueStore = defaultStore()) {
  const q = enqueue(readQueue(key, store), prev, next);
  writeQueue(key, q, store);
  return q;
}

export const pendingCount = (q: SyncQueue) => Object.keys(q.students).length;

const inFlight = new Map<string, Promise<SyncResult[] | null>>();

/**
 * Send everything pending for this queue once. Returns the server results, or null when there
 * was nothing to send. Throws on network/server failure — the queue is left untouched.
 * Calls for the same queue never overlap.
 */
export function flushQueue(key: string, transport: SyncTransport, store: KeyValueStore = defaultStore()): Promise<SyncResult[] | null> {
  const running = inFlight.get(key);
  if (running) return running.then(() => flushQueue(key, transport, store), () => flushQueue(key, transport, store));
  const job = (async () => {
    const sent = readQueue(key, store);
    if (!pendingCount(sent)) return null;
    const results = await transport(toWire(sent));
    writeQueue(key, acknowledge(readQueue(key, store), sent, results), store);
    return results;
  })();
  inFlight.set(key, job);
  const clear = () => { if (inFlight.get(key) === job) inFlight.delete(key); };
  job.then(clear, clear);
  return job;
}

/** Last known school membership, so a teacher who opens the app offline still has their edits queued. */
const membershipKey = (userId: string) => `edureport-membership-v1:${userId}`;
export interface CachedMembership { schoolId: string; schoolName?: string; joinCode?: string; role?: string }
export function readMembership(userId: string, store: KeyValueStore = defaultStore()): CachedMembership | null {
  try { const m = JSON.parse(store.getItem(membershipKey(userId)) || "null"); return m && typeof m.schoolId === "string" ? m : null; } catch { return null; }
}
export function writeMembership(userId: string, m: CachedMembership | null, store: KeyValueStore = defaultStore()) {
  if (m) store.setItem(membershipKey(userId), JSON.stringify(m)); else store.removeItem(membershipKey(userId));
}
