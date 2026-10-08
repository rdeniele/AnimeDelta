import assert from "node:assert/strict";
import { test } from "node:test";
import { CacheManager } from "./cacheManager.js";

test("get/set round-trips a value", () => {
  const c = new CacheManager();
  c.set("k", { a: 1 }, 1000);
  assert.deepEqual(c.get("k"), { a: 1 });
});

test("expired entries return undefined and are evicted", async () => {
  const c = new CacheManager();
  c.set("k", "v", 1);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(c.get("k"), undefined);
  assert.equal(c.size(), 0);
});

test("getOrSet only computes once while the cache entry is fresh", async () => {
  const c = new CacheManager();
  let calls = 0;
  const compute = async () => {
    calls += 1;
    return calls;
  };
  assert.equal(await c.getOrSet("k", 1000, compute), 1);
  assert.equal(await c.getOrSet("k", 1000, compute), 1); // still cached
  assert.equal(calls, 1);
});

test("getOrSet recomputes after expiry", async () => {
  const c = new CacheManager();
  let calls = 0;
  const compute = async () => {
    calls += 1;
    return calls;
  };
  assert.equal(await c.getOrSet("k", 1, compute), 1);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(await c.getOrSet("k", 1000, compute), 2);
});

test("delete/clear remove entries", () => {
  const c = new CacheManager();
  c.set("a", 1, 1000);
  c.set("b", 2, 1000);
  c.delete("a");
  assert.equal(c.get("a"), undefined);
  assert.equal(c.get("b"), 2);
  c.clear();
  assert.equal(c.size(), 0);
});
