import { NextResponse, type NextRequest } from "next/server";
import { parseHost } from "@zorriel/shared";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "zorriel.localhost";

/**
 * One deployment serves every shop. The root domain shows the public signup page;
 * <slug>.<root> and custom domains show that shop's admin.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const kind = parseHost(host, ROOT_DOMAIN).kind;
  const { pathname } = req.nextUrl;
  if (kind === "root" && !pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/signup", req.url));
  }
  if (kind !== "root" && pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"] };
