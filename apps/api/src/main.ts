import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
const port = Number(process.env.API_PORT ?? 4000);
await app.listen(port, "0.0.0.0");
console.log(`api listening on :${port}`);
