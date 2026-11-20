import { Body, Controller, Get, Post } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { withTenant, products, productVariants, stockMovements } from "@zorriel/db";
import { productCreateSchema, type ProductCreate } from "@zorriel/shared";
import { InjectDb, type Db } from "../common/db.module.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { CurrentTenant } from "../common/tenant.decorator.js";
import type { TenantCtx } from "../common/tenant.middleware.js";

// TODO(phase 1, next PR): protect with auth + role guard. Not safe to expose publicly yet.
@Controller("products")
export class ProductsController {
  constructor(@InjectDb() private db: Db) {}

  @Get()
  list(@CurrentTenant() t: TenantCtx) {
    return withTenant(this.db, t.id, async (tx) => {
      const rows = await tx.select().from(products).orderBy(desc(products.createdAt)).limit(200);
      const variants = await tx.select().from(productVariants);
      return rows.map((p) => ({ ...p, variants: variants.filter((v) => v.productId === p.id) }));
    });
  }

  @Post()
  create(@CurrentTenant() t: TenantCtx, @Body(new ZodPipe(productCreateSchema)) body: ProductCreate) {
    return withTenant(this.db, t.id, async (tx) => {
      const { variants, ...p } = body;
      const [product] = await tx.insert(products).values({ ...p, tenantId: t.id }).returning();
      const created = await tx.insert(productVariants).values(variants.map((v) => ({
        tenantId: t.id, productId: product!.id, name: v.name, sku: v.sku, barcode: v.barcode,
        priceBdt: v.priceBdt.toFixed(2), costBdt: v.costBdt?.toFixed(2),
        stockQty: String(v.stockQty), lowStockAt: v.lowStockAt?.toString(),
      }))).returning();
      const opening = created.filter((v) => Number(v.stockQty) > 0);
      if (opening.length) {
        await tx.insert(stockMovements).values(opening.map((v) => ({
          tenantId: t.id, variantId: v.id, qtyChange: v.stockQty, reason: "adjustment" as const, note: "Opening stock",
        })));
      }
      return { ...product!, variants: created };
    });
  }
}
