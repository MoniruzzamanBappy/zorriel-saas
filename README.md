# Zorriel

Multi-tenant SaaS for shops in Bangladesh: POS billing, stock, customers and an online COD storefront.
Every shop runs on its own subdomain (`<shop>.zorriel.com`) of one shared system.

## Layout

| Path | What |
| --- | --- |
| `apps/api` | NestJS API. Resolves the shop from the request host, all shop data goes through `withTenant()` |
| `apps/admin` | Next.js shop admin. Root domain shows signup; a shop subdomain shows that shop's dashboard |
| `packages/db` | Drizzle schema, migrations, Row Level Security, `withTenant()` |
| `packages/shared` | Zod schemas and host parsing shared by API and apps |
| `infra` | Docker Compose, Caddy and Postgres setup for the VPS |

Coming next: `apps/storefront` (phase 3) and `apps/platform` (phase 4).

## How shops are kept apart

Every shop-owned table has `tenant_id` and Postgres Row Level Security (`packages/db/migrations/0001_rls.sql`).
The API connects as `zorriel_app`, which can't bypass RLS, and runs each request inside
`withTenant(db, tenantId, ...)`, which sets `app.tenant_id` for that transaction only.
A missing or wrong tenant means the query sees no rows, not someone else's rows.
`packages/db/test/rls.test.ts` proves this.

## Local development

Needs Node 22, pnpm 9 and Postgres 16.

```bash
pnpm install
cp .env.example .env
# create roles and database (once)
sudo -u postgres psql -v owner_password=change-me -v app_password=change-me -f infra/db-init.sql
set -a; . ./.env; set +a
pnpm build && pnpm db:migrate && pnpm test

# run
(cd apps/api && pnpm start) & (cd apps/admin && pnpm dev)
```

Open http://zorriel.localhost:3000 to sign up a shop, then http://<slug>.zorriel.localhost:3000.
Chrome and Firefox resolve `*.localhost` to your machine automatically.

## Deploying to the Hostinger VPS

1. **Cloudflare:** add the domain to Cloudflare (free), switch nameservers at Hostinger, add proxied `A` records
   for `@` and `*` pointing to the VPS IP, set SSL mode to *Full (strict)*.
2. **Origin certificate:** Cloudflare, SSL/TLS, Origin Server, create a certificate for `zorriel.com, *.zorriel.com`.
   Save it on the VPS as `/opt/zorriel/app/infra/certs/origin.pem` and `origin.key`.
3. **VPS:** Ubuntu 24.04, SSH keys only, `ufw allow 22,80,443`, install Docker.
4. **App:** `git clone` into `/opt/zorriel/app`, copy `infra/.env.production.example` to `/opt/zorriel/.env` with strong passwords, then
   `docker compose -f infra/docker-compose.yml --env-file /opt/zorriel/.env up -d --build`.
5. **Auto deploy:** add `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` as GitHub secrets and enable the push trigger in `.github/workflows/deploy.yml`.

Do not deploy publicly until login is in place (next PR): product routes are not yet protected.
