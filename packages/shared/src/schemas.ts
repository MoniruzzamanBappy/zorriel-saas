import { z } from "zod";
import { isValidSlug } from "./tenant-host.js";

/** Bangladeshi mobile number: 01XXXXXXXXX, optionally with +88 / 88 prefix. Normalised to 01XXXXXXXXX. */
export const bdPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^\+?88/, ""))
  .refine((s) => /^01[3-9]\d{8}$/.test(s), "Enter a valid Bangladeshi mobile number");

export const shopSignupSchema = z.object({
  shopName: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().refine(isValidSlug, "Use 3 to 32 lowercase letters, numbers or hyphens"),
  businessType: z.string().trim().max(40).optional(),
  ownerName: z.string().trim().min(2).max(80),
  phone: bdPhone,
  address: z.string().trim().max(300).optional(),
});
export type ShopSignup = z.infer<typeof shopSignupSchema>;

const money = z.coerce.number().nonnegative().multipleOf(0.01);

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  nameBn: z.string().trim().max(160).optional(),
  categoryId: z.string().uuid().optional(),
  unit: z.enum(["piece", "kg", "gram", "litre", "packet", "dozen", "metre", "box"]).default("piece"),
  description: z.string().max(5000).optional(),
  variants: z
    .array(z.object({
      name: z.string().trim().min(1).max(80).default("Default"),
      sku: z.string().trim().max(60).optional(),
      barcode: z.string().trim().max(60).optional(),
      priceBdt: money,
      costBdt: money.optional(),
      stockQty: z.coerce.number().nonnegative().default(0),
      lowStockAt: z.coerce.number().nonnegative().optional(),
    }))
    .min(1),
});
export type ProductCreate = z.infer<typeof productCreateSchema>;
