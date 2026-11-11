/** Seeded pick of `count` items, preferring items whose key was not in the previous set. */
export function pickFresh<T>(pool: readonly T[], seed: number, count: number, key: (item: T) => string, previous: ReadonlySet<string> = new Set()): T[] {
  let state = (seed ^ 0x9e3779b9) >>> 0;
  const rand = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const ranked = pool.map((item) => ({ item, r: rand() })).sort((a, b) => a.r - b.r).map((x) => x.item);
  const fresh = ranked.filter((i) => !previous.has(key(i)));
  const old = ranked.filter((i) => previous.has(key(i)));
  return [...fresh, ...old].slice(0, count);
}
