import { z } from "zod";

// ── Products ────────────────────────────────────────
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
  quantity: z.number().int().min(0, "Quantity must be 0 or more"),
  price: z.number().min(0, "Price must be 0 or more"),
  lowStockThreshold: z.number().int().min(0).default(10),
  description: z.string().optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;

// ── Location ─────────────────────────────────────────

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
  level: z.number().int().refine(v => [0,10,20,30,40,50,60].includes(v), {
    message: "Level must be 0, 10... 60",
  }),
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

// Joined view — для відображення в UI
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

// ── User roles ──────────────────────────────────────
export const USER_ROLES = ["admin", "user"] as const;

// ── Users ───────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearanceLevel: string;
  role: string;
  isActive: boolean;
  createdAt: Date | null;
}

export type SafeUser = Omit<User, "password">;

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  rank: z.string().min(1, "Rank is required"),
  unit: z.string().min(1, "Unit is required"),
  callsign: z.string().optional(),
  clearanceLevel: z.enum(CLEARANCE_LEVELS).default("No clearance"),
  role: z.enum(USER_ROLES).default("user"),
  isActive: z.boolean().default(true),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Enter username"),
  password: z.string().min(1, "Enter password"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
