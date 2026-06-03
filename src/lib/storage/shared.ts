import type { getSupabase } from "../supabase";
import type {
  Product,
  ProductLocationView,
} from "../schema";
import type { Permission } from "../permissions";
import type { User, SafeUser } from "../userTypes";

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  description: string | null;
}

export interface DbUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearanceLevel: string;
  isActive: boolean;
  createdAt: string | null;
  userPermissions?: { permissions: { key: string } }[];
  sessionVersion: string | null;
}

export interface DbProductLocationViewRow {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at: string;
  locations: {
    label: string;
    row: number;
    col: number;
    level: number;
  }[] | null;
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
  createdAt: string;
  users?: {
    username: string;
    fullName: string;
  }[] | null;
}

export type ProductUpdateDbPayload = Partial<{
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  description: string | null;
}>;

export type UpdateUserInput = {
  username?: string;
  fullName?: string;
  rank?: string;
  unit?: string;
  callsign?: string | null;
  clearanceLevel?: string;
  isActive?: boolean;
  password?: string;
  permissions?: Permission[];
};

export type UserUpdateDbPayload = Partial<{
  username: string;
  fullName: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearanceLevel: string;
  isActive: boolean;
  password: string;
}>;

export type StorageContext = {
  db: () => ReturnType<typeof getSupabase>;
  audit: (actorUserId: string) => {
    p_actor_user_id: string;
    p_correlation_id: string;
  };
  hashPassword: (password: string) => Promise<string>;
};

export const USER_WITH_PERMISSIONS = `
  *,
  userPermissions (
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
    lowStockThreshold: row.lowStockThreshold,
    description: row.description,
  };
}

export function dbToUser(row: DbUser): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    fullName: row.fullName,
    rank: row.rank,
    unit: row.unit,
    callsign: row.callsign,
    clearanceLevel: row.clearanceLevel,
    permissions: (row.userPermissions ?? []).map(
      (up) => up.permissions.key as Permission,
    ),
    isActive: row.isActive,
    createdAt: row.createdAt ? new Date(row.createdAt) : null,
    sessionVersion: row.sessionVersion ?? undefined,
  };
}

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safe } = user;
  return safe;
}

export function dbToProductLocationView(
  row: DbProductLocationViewRow,
): ProductLocationView {
  const location = row.locations?.[0];

  return {
    id: row.id,
    productId: row.product_id,
    locationId: row.location_id,
    quantity: row.quantity,
    updatedAt: row.updated_at,
    locationLabel: location?.label ?? "",
    locationRow: location?.row ?? 0,
    locationCol: location?.col ?? 0,
    locationLevel: location?.level ?? 0,
  };
}

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export interface AuditLogFilters {
  action?: AuditAction | "all";
  actorUserId?: string;
  limit?: number;
  q?: string;
  tableName?: string;
}

export interface DbAuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  correlation_id: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  tableName: string;
  recordId: string | null;
  action: AuditAction;
  actorUserId: string | null;
  actorUsername: string | null;
  actorFullName: string | null;
  correlationId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}
