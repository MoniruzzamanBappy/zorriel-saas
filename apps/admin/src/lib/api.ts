import "server-only";
import { headers } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** Server-side call to the API, scoped to the shop whose address this request came in on. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const res = await fetch(API_URL + path, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", "x-tenant-host": host, ...(init.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as T;
  return { ok: res.ok, status: res.status, data };
}
