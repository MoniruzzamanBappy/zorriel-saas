import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import type { Request } from "express";
import type { TenantCtx } from "./tenant.middleware.js";

/** The shop resolved by TenantMiddleware for this request. */
export const CurrentTenant = createParamDecorator((_: unknown, ctx: ExecutionContext): TenantCtx => {
  const t = ctx.switchToHttp().getRequest<Request>().tenant;
  if (!t) throw new InternalServerErrorException("TenantMiddleware did not run for this route");
  return t;
});
