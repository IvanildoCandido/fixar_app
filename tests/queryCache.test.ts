import assert from "node:assert/strict";
import test from "node:test";
import { cachedQuery, clearQueryCache, getQueryMetrics, invalidateQueries } from "../src/services/queryCache";

test("cache reutiliza resultado e invalidação força uma nova consulta", async () => {
  clearQueryCache();
  let calls = 0;
  const loader = async () => ++calls;

  assert.equal(await cachedQuery("customers:test", 60_000, loader), 1);
  assert.equal(await cachedQuery("customers:test", 60_000, loader), 1);
  assert.equal(calls, 1);

  invalidateQueries("customers:");
  assert.equal(await cachedQuery("customers:test", 60_000, loader), 2);
});

test("cache consolida consultas simultâneas e registra métricas", async () => {
  clearQueryCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await Promise.resolve();
    return "ok";
  };

  const [first, second] = await Promise.all([
    cachedQuery("repairs:test", 60_000, loader),
    cachedQuery("repairs:test", 60_000, loader),
  ]);

  assert.deepEqual([first, second], ["ok", "ok"]);
  assert.equal(calls, 1);
  const metric = getQueryMetrics().find((item) => item.key === "repairs:test");
  assert.equal(metric?.requests, 2);
  assert.equal(metric?.cacheHits, 1);
});
