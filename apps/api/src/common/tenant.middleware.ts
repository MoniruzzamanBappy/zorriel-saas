import { Injectable, NestMiddleware, NotFoundException, ForbiddenException } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { tenants } from "@zorriel/db";
import { parseHost } from "@zorriel/shared";
import { InjectDb, type Db } from "./db.module.js";

export type TenantCtx = { id: string; slug: string; name: string; status: string };
declare module "express" { interface Request { tenant?: TenantCtx } }

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "zorriel.localhost";

/**
 * Finds the shop for this request. The Next.js apps forward the browser's host in
 * `x-tenant-host`; direct calls fall back to the Host header.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private cache = new Map<string, { t: TenantCtx; at: number }>();
  constructor(@InjectDb() private db: Db) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const host = String(req.headers["x-tenant-host"] ?? req.headers.host ?? "");
    const parsed = parseHost(host, ROOT_DOMAIN);
    if (parsed.kind !== "shop" && parsed.kind !== "custom") throw new NotFoundException("No shop on this address");

    const key = parsed.kind === "shop" ? `s:${parsed.slug}` : `d:${parsed.domain}`;
    const hit = this.cache.get(key);
    let t = hit && Date.now() - hit.at < 30_000 ? hit.t : undefined;
    if (!t) {
      const where = parsed.kind === "shop" ? eq(tenants.slug, parsed.slug) : eq(tenants.customDomain, parsed.domain);
      const [row] = await this.db
        .select({ id: tenants.id, slug: tenants.slug, name: tenants.name, status: tenants.status })
        .from(tenants).where(where).limit(1);
      if (!row) throw new NotFoundException("Shop not found");
      t = row;
      this.cache.set(key, { t, at: Date.now() });
    }
    if (t.status === "suspended" || t.status === "cancelled") throw new ForbiddenException("This shop is not active");
    req.tenant = t;
    next();
  }
}
