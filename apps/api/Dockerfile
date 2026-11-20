FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @zorriel/api... build \
 && pnpm deploy --filter @zorriel/api --prod /out \
 && cp -r apps/api/dist /out/dist \
 && mkdir -p /out/migrations && cp -r packages/db/migrations/. /out/migrations/

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out .
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
