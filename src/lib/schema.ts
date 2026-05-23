import { z } from "zod";
import { PERMISSIONS } from "./permissions";
import type { Permission } from "./permissions";

// ── Permissions ───────────────────────────────────────

const VALID_PERMISSIONS = Object.values(PERMISSIONS) as [Permission, ...Permission[]];
const permissionSchema = z.enum(VALID_PERMISSIONS);

// ── Product ───────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  description: string | null;
}

export const insertProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().int().min(0).default(0),
  price: z.number().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  description: z.string().nullable().optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;

// ── Location ──────────────────────────────────────────
export interface Location {
  id: string;
  row: number;
  col: number;
  level: number;
  label: string;
}

export const insertLocationSchema = z.object({
  row:   z.number().int().min(1).max(100),
  col:   z.number().int().min(1).max(100),
  level: z.number().int().refine(
      (v) => [0, 10, 20, 30, 40, 50, 60].includes(v),
      { message: "Level must be 0, 10, 20, 30, 40, 50 or 60" }
  ),
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;

// ── ProductLocation ───────────────────────────────────

export interface ProductLocation {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  updatedAt: string;
}

export interface ProductLocationView extends ProductLocation {
  locationLabel: string;
  locationRow: number;
  locationCol: number;
  locationLevel: number;
}

export const insertProductLocationSchema = z.object({
  productId:  z.string().uuid("Invalid product ID"),
  locationId: z.string().uuid("Invalid location ID"),
  quantity:   z.number().int().min(0, "Quantity must be 0 or more"),
});

export type InsertProductLocation = z.infer<typeof insertProductLocationSchema>;

// ── Military ranks ──────────────────────────────────
export const MILITARY_RANKS = [
  "Private",
  "Senior Private",
  "Junior Sergeant",
  "Sergeant",
  "Senior Sergeant",
  "Chief Sergeant",
  "Staff Sergeant",
  "Master Sergeant",
  "Senior Master Sergeant",
  "Chief Master Sergeant",
  "Junior Lieutenant",
  "Lieutenant",
  "Senior Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "Brigadier General",
  "Major General",
  "Lieutenant General",
  "General",
] as const;

// ── Security clearance levels ───────────────────────
export const CLEARANCE_LEVELS = [
  "No clearance",
  "For official use only",
  "Secret",
  "Top secret",
  "Special importance",
] as const;

// ── Users ─────────────────────────────────────────────
export const insertUserSchema = z.object({
  username:      z.string().min(3, "Min 3 characters").max(50),
  password:      z.string().min(6, "Min 6 characters"),
  full_name:      z.string().min(1, "Required"),
  rank:          z.string().min(1, "Required"),
  unit:          z.string().min(1, "Required"),
  callsign:      z.string().nullable().optional(),
  clearanceLevel: z.string().default("No clearance"),
  permissions:   z.array(permissionSchema).default([]),
  isActive:      z.boolean().default(true),
});

export const updateUserSchema = insertUserSchema
    .partial()
    .omit({ password: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;