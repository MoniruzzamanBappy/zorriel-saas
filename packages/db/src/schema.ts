import {
  pgTable, pgEnum, uuid, text, timestamp, integer, numeric, boolean, uniqueIndex, index,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
// Every shop-owned table carries tenant_id; Row Level Security (see migrations/0001_rls.sql) filters on it.
const tenantId = () => uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" });

export const tenantStatus = pgEnum("tenant_status", ["trial", "active", "suspended", "cancelled"]);
export const memberRole = pgEnum("member_role", ["owner", "manager", "cashier"]);
export const stockReason = pgEnum("stock_reason", ["purchase", "sale", "return", "adjustment", "online_order"]);
export const orderChannel = pgEnum("order_channel", ["pos", "online"]);
export const orderStatus = pgEnum("order_status", ["new", "confirmed", "delivered", "cancelled"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "bkash", "nagad", "card", "cod", "due"]);

// ---- Platform-level (not tenant-scoped) ----

export const tenants = pgTable("tenants", {
  id: id(),
  slug: text("slug").notNull(), // subdomain: <slug>.<ROOT_DOMAIN>
  name: text("name").notNull(),
  businessType: text("business_type"), // grocery, rice, clothing, bakery...
  phone: text("phone").notNull(),
  address: text("address"),
  logoUrl: text("logo_url"),
  customDomain: text("custom_domain"),
  status: tenantStatus("status").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("tenants_slug_uq").on(t.slug),
  uniqueIndex("tenants_custom_domain_uq").on(t.customDomain),
]);

export const users = pgTable("users", {
  id: id(),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("users_phone_uq").on(t.phone)]);

export const plans = pgTable("plans", {
  id: id(),
  code: text("code").notNull(), // starter, business, pro
  name: text("name").notNull(),
  priceMonthlyBdt: integer("price_monthly_bdt").notNull(),
  priceYearlyBdt: integer("price_yearly_bdt").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxProducts: integer("max_products"), // null = unlimited
  hasStorefront: boolean("has_storefront").notNull().default(false),
  hasCustomDomain: boolean("has_custom_domain").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
}, (t) => [uniqueIndex("plans_code_uq").on(t.code)]);

// ---- Tenant-scoped ----

export const memberships = pgTable("memberships", {
  id: id(),
  tenantId: tenantId(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: memberRole("role").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("memberships_tenant_user_uq").on(t.tenantId, t.userId)]);

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  tenantId: tenantId(),
  planId: uuid("plan_id").notNull().references(() => plans.id),
  interval: text("interval").notNull().default("monthly"), // monthly | yearly
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (t) => [index("subscriptions_tenant_idx").on(t.tenantId)]);

export const categories = pgTable("categories", {
  id: id(),
  tenantId: tenantId(),
  name: text("name").notNull(),
  nameBn: text("name_bn"),
  parentId: uuid("parent_id"),
  createdAt: createdAt(),
}, (t) => [index("categories_tenant_idx").on(t.tenantId)]);

export const products = pgTable("products", {
  id: id(),
  tenantId: tenantId(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  nameBn: text("name_bn"),
  description: text("description"),
  unit: text("unit").notNull().default("piece"), // piece, kg, packet, litre...
  imageUrls: text("image_urls").array().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true), // shown on storefront
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("products_tenant_idx").on(t.tenantId)]);

// A product always has at least one variant (size/colour/weight); stock and price live here.
export const productVariants = pgTable("product_variants", {
  id: id(),
  tenantId: tenantId(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Default"), // e.g. "M / Blue", "5 kg"
  sku: text("sku"),
  barcode: text("barcode"),
  priceBdt: numeric("price_bdt", { precision: 12, scale: 2 }).notNull(),
  costBdt: numeric("cost_bdt", { precision: 12, scale: 2 }),
  stockQty: numeric("stock_qty", { precision: 12, scale: 3 }).notNull().default("0"),
  lowStockAt: numeric("low_stock_at", { precision: 12, scale: 3 }),
}, (t) => [
  index("variants_tenant_idx").on(t.tenantId),
  uniqueIndex("variants_tenant_barcode_uq").on(t.tenantId, t.barcode),
]);

export const stockMovements = pgTable("stock_movements", {
  id: id(),
  tenantId: tenantId(),
  variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  qtyChange: numeric("qty_change", { precision: 12, scale: 3 }).notNull(),
  reason: stockReason("reason").notNull(),
  orderId: uuid("order_id"),
  note: text("note"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => [index("stock_movements_tenant_idx").on(t.tenantId, t.variantId)]);

export const customers = pgTable("customers", {
  id: id(),
  tenantId: tenantId(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  dueBdt: numeric("due_bdt", { precision: 12, scale: 2 }).notNull().default("0"), // baki
  createdAt: createdAt(),
}, (t) => [
  index("customers_tenant_idx").on(t.tenantId),
  uniqueIndex("customers_tenant_phone_uq").on(t.tenantId, t.phone),
]);

export const orders = pgTable("orders", {
  id: id(),
  tenantId: tenantId(),
  number: integer("number").notNull(), // per-shop running number
  channel: orderChannel("channel").notNull(),
  status: orderStatus("status").notNull().default("new"),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  shippingName: text("shipping_name"),
  shippingPhone: text("shipping_phone"),
  shippingAddress: text("shipping_address"),
  subtotalBdt: numeric("subtotal_bdt", { precision: 12, scale: 2 }).notNull(),
  discountBdt: numeric("discount_bdt", { precision: 12, scale: 2 }).notNull().default("0"),
  deliveryFeeBdt: numeric("delivery_fee_bdt", { precision: 12, scale: 2 }).notNull().default("0"),
  totalBdt: numeric("total_bdt", { precision: 12, scale: 2 }).notNull(),
  paidBdt: numeric("paid_bdt", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod: paymentMethod("payment_method").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => [
  index("orders_tenant_idx").on(t.tenantId, t.createdAt),
  uniqueIndex("orders_tenant_number_uq").on(t.tenantId, t.number),
]);

export const orderItems = pgTable("order_items", {
  id: id(),
  tenantId: tenantId(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  nameSnapshot: text("name_snapshot").notNull(),
  qty: numeric("qty", { precision: 12, scale: 3 }).notNull(),
  unitPriceBdt: numeric("unit_price_bdt", { precision: 12, scale: 2 }).notNull(),
  lineTotalBdt: numeric("line_total_bdt", { precision: 12, scale: 2 }).notNull(),
}, (t) => [index("order_items_tenant_idx").on(t.tenantId, t.orderId)]);

/** Tables protected by Row Level Security. Keep in sync with migrations/0001_rls.sql. */
export const TENANT_TABLES = [
  "memberships", "subscriptions", "categories", "products", "product_variants",
  "stock_movements", "customers", "orders", "order_items",
] as const;
