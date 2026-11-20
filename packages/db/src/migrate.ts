import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./client.js";

const url = process.env.DATABASE_ADMIN_URL;
if (!url) throw new Error("DATABASE_ADMIN_URL is not set");
const { db, client } = createDb(url, { max: 1 });
await migrate(db, { migrationsFolder: new URL("../migrations", import.meta.url).pathname });
await client.end();
console.log("migrations applied");
