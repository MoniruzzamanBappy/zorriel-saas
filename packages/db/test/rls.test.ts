// Proves one shop can never read or write another shop's rows.
// Needs DATABASE_URL (app role) and DATABASE_ADMIN_URL (owner role) against a migrated database.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createDb, withTenant, tenants, products } from "../src/index.js";

const admin = createDb(process.env.DATABASE_ADMIN_URL!, { max: 1 });
const app = createDb(process.env.DATABASE_URL!, { max: 2 });
after(async () => { await admin.client.end(); await app.client.end(); });

async function makeTenant(slug: string) {
  await admin.db.delete(tenants).where(eq(tenants.slug, slug));
  const [t] = await admin.db.insert(tenants).values({ slug, name: slug, phone: "01700000000" }).returning();
  return t!;
}

test("each shop only sees its own products", async () => {
  const rahim = await makeTenant("test-rahim-rice");
  const karim = await makeTenant("test-karim-grocery");

  await withTenant(app.db, rahim.id, (tx) => tx.insert(products).values({ tenantId: rahim.id, name: "Miniket rice" }));
  await withTenant(app.db, karim.id, (tx) => tx.insert(products).values({ tenantId: karim.id, name: "Mustard oil" }));

  const rahimSees = await withTenant(app.db, rahim.id, (tx) => tx.select().from(products));
  const karimSees = await withTenant(app.db, karim.id, (tx) => tx.select().from(products));
  assert.deepEqual(rahimSees.map((p) => p.name), ["Miniket rice"]);
  assert.deepEqual(karimSees.map((p) => p.name), ["Mustard oil"]);
});

test("a shop cannot insert rows for another shop", async () => {
  const a = await makeTenant("test-shop-a");
  const b = await makeTenant("test-shop-b");
  await assert.rejects(
    withTenant(app.db, a.id, (tx) => tx.insert(products).values({ tenantId: b.id, name: "sneaky" })),
    /row-level security/,
  );
});

test("without a tenant set, no rows are visible", async () => {
  const rows = await app.db.select().from(products);
  assert.equal(rows.length, 0);
});

test("withTenant rejects a malformed tenant id", async () => {
  await assert.rejects(withTenant(app.db, "1; drop table products", async () => 0), /invalid tenant id/);
});
