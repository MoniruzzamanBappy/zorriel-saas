import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { createDb, type Db } from "@zorriel/db";

export const DB = Symbol("DB");
export const InjectDb = () => Inject(DB);

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const { db, client } = createDb(url);

@Global()
@Module({ providers: [{ provide: DB, useValue: db }], exports: [DB] })
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown() { await client.end(); }
}
export type { Db };
