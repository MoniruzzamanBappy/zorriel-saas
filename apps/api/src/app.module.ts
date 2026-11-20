import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { DbModule } from "./common/db.module.js";
import { TenantMiddleware } from "./common/tenant.middleware.js";
import { HealthController } from "./health/health.controller.js";
import { SignupController, TenantsController } from "./tenants/tenants.controller.js";
import { ProductsController } from "./products/products.controller.js";

@Module({
  imports: [DbModule],
  controllers: [HealthController, SignupController, TenantsController, ProductsController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes(TenantsController, ProductsController);
  }
}
