import { Body, ConflictException, Controller, Get, Post } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { tenants, users, memberships } from "@zorriel/db";
import { shopSignupSchema, type ShopSignup } from "@zorriel/shared";
import { InjectDb, type Db } from "../common/db.module.js";
import { ZodPipe } from "../common/zod.pipe.js";
import { CurrentTenant } from "../common/tenant.decorator.js";
import type { TenantCtx } from "../common/tenant.middleware.js";

const TRIAL_DAYS = 14;

@Controller("signup")
export class SignupController {
  constructor(@InjectDb() private db: Db) {}

  /** Creates a shop, its owner and the owner's membership, and starts a free trial. */
  @Post()
  async signup(@Body(new ZodPipe(shopSignupSchema)) body: ShopSignup) {
    const ROOT = process.env.ROOT_DOMAIN ?? "zorriel.localhost";
    try {
      return await this.db.transaction(async (tx) => {
        const [tenant] = await tx.insert(tenants).values({
          slug: body.slug, name: body.shopName, businessType: body.businessType, phone: body.phone,
          address: body.address, trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 864e5),
        }).returning();
        await tx.execute(sql`select set_config('app.tenant_id', ${tenant!.id}, true)`);
        await tx.insert(users).values({ phone: body.phone, name: body.ownerName }).onConflictDoNothing();
        const [owner] = await tx.select({ id: users.id }).from(users).where(eq(users.phone, body.phone));
        await tx.insert(memberships).values({ tenantId: tenant!.id, userId: owner!.id, role: "owner" });
        return { tenantId: tenant!.id, slug: tenant!.slug, url: `https://${tenant!.slug}.${ROOT}`, trialEndsAt: tenant!.trialEndsAt };
      });
    } catch (e: any) {
      if (e?.code === "23505" && String(e?.constraint_name ?? e?.message).includes("tenants_slug")) {
        throw new ConflictException("That shop address is already taken");
      }
      throw e;
    }
  }
}

@Controller("tenant")
export class TenantsController {
  /** Public info about the shop on this address (used by storefront and admin to brand the page). */
  @Get()
  current(@CurrentTenant() t: TenantCtx) {
    return { slug: t.slug, name: t.name, status: t.status };
  }
}
