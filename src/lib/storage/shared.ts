import type { getSupabase } from "../supabase";
import type { Product, ProductLocationView } from "../schema";
import type { Permission } from "../permissions";
import type { User, SafeUser } from "../userTypes";

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  description: string | null;
}

export interface DbUser {
  id: string;
  username: string;
  password: string;
  full_name: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearance_level: string;
  is_active: boolean;
  created_at: string | null;
  user_permissions?: { permissions: { key: string } }[];
  session_version: string | null;
}

export interface DbProductLocationViewRow {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at: string;
  locations: {
    label: string;
  }[]
  | null;
}

export interface DbAuditLogRow {
  id: string;
  table_name: string;
  record_id: string | null;
  action: AuditAction;
  actor_user_id: string | null;
  correlation_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  users?:
    | {
        username: string;
        full_name: string;
      }[]
    | null;
}

export type ProductUpdateDbPayload = Partial<{
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  description: string | null;
}>;

export type UpdateUserInput = {
  username?: string;
  full_name?: string;
  rank?: string;
  unit?: string;
  callsign?: string | null;
  clearance_level?: string;
  is_active?: boolean;
  password?: string;
  permissions?: Permission[];
};

export type UserUpdateDbPayload = Partial<{
  username: string;
  full_name: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearance_level: string;
  is_active: boolean;
  password: string;
}>;

export type StorageContext = {
  db: () => ReturnType<typeof getSupabase>;
  audit: (actor_user_id: string) => {
    p_actor_user_id: string;
    p_correlation_id: string;
  };
  hashPassword: (password: string) => Promise<string>;
};

export const USER_WITH_PERMISSIONS = `
  *,
  user_permissions (
    permissions ( key )
  )
` as const;

export function hasKeys(obj: object): boolean {
  return Object.keys(obj).length > 0;
}

export function dbToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    quantity: row.quantity,
    price: Number(row.price),
    low_stock_threshold: row.low_stock_threshold,
    description: row.description,
  };
}

export function dbToUser(row: DbUser): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    full_name: row.full_name,
    rank: row.rank,
    unit: row.unit,
    callsign: row.callsign,
    clearance_level: row.clearance_level,
    permissions: (row.user_permissions ?? []).map(
      (up) => up.permissions.key as Permission,
    ),
    is_active: row.is_active,
    created_at: row.created_at ? new Date(row.created_at) : null,
    session_version: row.session_version ?? undefined,
  };
}

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safe } = user;
  return safe;
}

// export function dbToProductLocationView(
//   row: DbProductLocationViewRow,
// ): ProductLocationView {
//   const location = row.locations?.[0];
//
//   return {
//     id: row.id,
//     product_id: row.product_id,
//     location_id: row.location_id,
//     quantity: row.quantity,
//     updated_at: row.updated_at,
//     location_label: location?.label ?? "",
//   };
// }

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export interface AuditLogFilters {
  action?: AuditAction | "all";
  actor_user_id?: string;
  limit?: number;
  q?: string;
  table_name?: string;
}

export interface AuditLogItem {
  id: string;
  table_name: string;
  record_id: string | null;
  action: AuditAction;
  actor_user_id: string | null;
  actorUsername: string | null;
  actorFullName: string | null;
  correlation_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}
