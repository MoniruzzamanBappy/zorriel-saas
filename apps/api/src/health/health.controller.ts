import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { InjectDb, type Db } from "../common/db.module.js";

@Controller("health")
export class HealthController {
  constructor(@InjectDb() private db: Db) {}
  @Get()
  async check() {
    await this.db.execute(sql`select 1`);
    return { ok: true };
  }
}
