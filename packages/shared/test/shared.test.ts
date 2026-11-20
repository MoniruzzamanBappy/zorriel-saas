import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHost, bdPhone, shopSignupSchema } from "../src/index.js";

test("parseHost", () => {
  const r = "zorriel.com";
  assert.deepEqual(parseHost("zorriel.com", r), { kind: "root" });
  assert.deepEqual(parseHost("www.zorriel.com", r), { kind: "root" });
  assert.deepEqual(parseHost("platform.zorriel.com", r), { kind: "platform" });
  assert.deepEqual(parseHost("Rahim-Rice.zorriel.com:443", r), { kind: "shop", slug: "rahim-rice" });
  assert.deepEqual(parseHost("api.zorriel.com", r), { kind: "root" });
  assert.deepEqual(parseHost("a.b.zorriel.com", r), { kind: "root" });
  assert.deepEqual(parseHost("shop.rahim.com", r), { kind: "custom", domain: "shop.rahim.com" });
});

test("bdPhone normalises and validates", () => {
  assert.equal(bdPhone.parse("+8801712-345678"), "01712345678");
  assert.equal(bdPhone.safeParse("01212345678").success, false);
});

test("shop signup rejects reserved slugs", () => {
  const base = { shopName: "Zorriel", ownerName: "Apu", phone: "01712345678" };
  assert.equal(shopSignupSchema.safeParse({ ...base, slug: "zorriel" }).success, true);
  assert.equal(shopSignupSchema.safeParse({ ...base, slug: "admin" }).success, false);
});
