type Entry<T> = { value: T; expiresAt: number };

const cache = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
const metrics = new Map<string, { requests: number; cacheHits: number; totalMs: number }>();

export async function cachedQuery<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const current = cache.get(key) as Entry<T> | undefined;
  const metric = metrics.get(key) ?? { requests: 0, cacheHits: 0, totalMs: 0 };
  metric.requests += 1; metrics.set(key, metric);
  if (current && current.expiresAt > now) { metric.cacheHits += 1; return current.value; }
  const inFlight = pending.get(key) as Promise<T> | undefined;
  if (inFlight) { metric.cacheHits += 1; return inFlight; }
  const startedAt = Date.now();
  const request = loader().then((value) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    metric.totalMs += Date.now() - startedAt;
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export function invalidateQueries(prefix: string) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

export function clearQueryCache() { cache.clear(); pending.clear(); }
export function getQueryMetrics() { return Array.from(metrics, ([key, value]) => ({ key, ...value })); }
