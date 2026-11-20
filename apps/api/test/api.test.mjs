// End-to-end: boots the built API against a migrated database and checks signup + tenant isolation over HTTP.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const PORT = 4555;
const base = `http://127.0.0.1:${PORT}`;
let proc;
const run = Date.now().toString(36);

before(async () => {
  proc = spawn("node", ["dist/main.js"], { env: { ...process.env, API_PORT: String(PORT), ROOT_DOMAIN: "zorriel.test" }, stdio: "inherit" });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("api did not start");
});
after(() => proc?.kill());

const post = (path, host, body) => fetch(base + path, {
  method: "POST", headers: { "content-type": "application/json", ...(host ? { "x-tenant-host": host } : {}) }, body: JSON.stringify(body),
});
const get = (path, host) => fetch(base + path, { headers: { "x-tenant-host": host } });

test("signup, then each shop sees only its own products", async () => {
  const a = `zr${run}`, b = `kg${run}`;
  for (const [slug, name] of [[a, "Zorriel"], [b, "Karim Grocery"]]) {
    const r = await post("/signup", null, { shopName: name, slug, ownerName: "Owner", phone: "+8801712345678" });
    assert.equal(r.status, 201, await r.clone().text());
  }
  const dup = await post("/signup", null, { shopName: "Copycat", slug: a, ownerName: "Someone", phone: "01712345679" });
  assert.equal(dup.status, 409);

  const made = await post("/products", `${a}.zorriel.test`, { name: "Cotton panjabi", unit: "piece", variants: [{ name: "M", priceBdt: 1450, stockQty: 10 }] });
  assert.equal(made.status, 201, await made.clone().text());

  const aList = await (await get("/products", `${a}.zorriel.test`)).json();
  const bList = await (await get("/products", `${b}.zorriel.test`)).json();
  assert.deepEqual(aList.map((p) => p.name), ["Cotton panjabi"]);
  assert.equal(aList[0].variants[0].stockQty, "10.000");
  assert.deepEqual(bList, []);

  assert.equal((await get("/products", `nope${run}.zorriel.test`)).status, 404);
  assert.equal((await get("/tenant", `${a}.zorriel.test`)).status, 200);
});
