/** Subdomains that can never be a shop. */
export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "platform", "mail", "static", "cdn", "assets", "help", "support", "status", "blog",
]);

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}

export type HostKind =
  | { kind: "root" }                       // zorriel.com or www.zorriel.com: marketing site
  | { kind: "platform" }                   // platform.zorriel.com: super-admin
  | { kind: "shop"; slug: string }          // rahim.zorriel.com
  | { kind: "custom"; domain: string };     // shop.rahim.com (looked up in tenants.custom_domain)

/** Work out which shop (if any) a request's Host header points at. */
export function parseHost(hostHeader: string, rootDomain: string): HostKind {
  const host = hostHeader.toLowerCase().split(":")[0]!.replace(/\.$/, "");
  const root = rootDomain.toLowerCase();
  if (host === root || host === `www.${root}`) return { kind: "root" };
  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    if (sub === "platform") return { kind: "platform" };
    if (!sub.includes(".") && isValidSlug(sub)) return { kind: "shop", slug: sub };
    return { kind: "root" };
  }
  return { kind: "custom", domain: host };
}
