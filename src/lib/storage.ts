import bcrypt from "bcryptjs";
import { getSupabase } from "./supabase";
import type {
  Product,
  InsertProduct,
  InsertUser,
  Location,
  ProductLocationView,
  ProductLocation,
  InsertProductLocation,
} from "./schema";
import { Permission } from "@/lib/permissions";
import type { User, SafeUser } from "@/lib/userTypes";
import { randomUUID } from "node:crypto";

// ── DB interfaces ─────────────────────────────────────

interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  low_stock_threshold: number;
  description: string | null;
}

interface DbUser {
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

// ── Mappers ───────────────────────────────────────────

function dbToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    quantity: row.quantity,
    price: Number(row.price),
    lowStockThreshold: row.low_stock_threshold,
    description: row.description,
  };
}

function dbToUser(row: DbUser): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    full_name: row.full_name,
    rank: row.rank,
    unit: row.unit,
    callsign: row.callsign,
    clearanceLevel: row.clearance_level,
    permissions: (row.user_permissions ?? []).map(
      (up) => up.permissions.key as Permission
    ),
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    sessionVersion: row.session_version ?? undefined,
  };
}

export function toSafeUser(user: User): SafeUser {
  const { password: _, ...safe } = user;
  return safe;
}

// ── Supabase select fragment ──────────────────────────

const USER_WITH_PERMISSIONS = `
  *,
  user_permissions (
    permissions ( key )
  )
` as const;

// ── Supabase Storage ──────────────────────────────────

class SupabaseStorage {
  private get db() {
    return getSupabase();
  }

  // ── Products ──────────────────────────────────────────
  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.db
      .from("products")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data as DbProduct[]).map(dbToProduct);
  }

  // ── Helpers ────────────────────────────────
  private audit(actorUserId?: string) {
    if (!actorUserId) {
      throw new Error("Missing actorUserId for audited RPC call");
    }

    return {
      p_actor_user_id: actorUserId,
      p_correlation_id: randomUUID(),
    };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await this.db
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return undefined;
    return dbToProduct(data as DbProduct);
  }

  // ── Products ──────────────────────────────────────────

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const { data, error } = await this.db
      .from("products")
      .select("*")
      .eq("sku", sku)
      .single();
    if (error) return undefined;
    return dbToProduct(data as DbProduct);
  }

  async createProduct(
    insertProduct: InsertProduct,
    actorUserId: string,
  ): Promise<Product> {
    const { data, error } = await this.db.rpc("create_product_with_audit", {
      p_name: insertProduct.name,
      p_sku: insertProduct.sku,
      p_category: insertProduct.category,
      p_quantity: insertProduct.quantity,
      p_price: insertProduct.price,
      p_low_stock_threshold: insertProduct.lowStockThreshold,
      p_description: insertProduct.description ?? null,
      ...this.audit(actorUserId),
    });

    if (error) throw error;
    return dbToProduct(data as DbProduct);
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>,
    actorUserId: string,
  ): Promise<Product | undefined> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.lowStockThreshold !== undefined) {
      dbUpdates.low_stock_threshold = updates.lowStockThreshold;
    }
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
    }

    if (!Object.keys(dbUpdates).length) {
      return this.getProduct(id);
    }

    const { data, error } = await this.db.rpc("update_product_with_audit", {
      p_product_id: id,
      p_updates: dbUpdates,
      ...this.audit(actorUserId),
    });

    if (error) throw error;
    if (!data) return undefined;
    return dbToProduct(data as DbProduct);
  }

  async deleteProduct(id: string, actorUserId: string): Promise<boolean> {
    const { data, error } = await this.db.rpc("delete_product_with_audit", {
      p_product_id: id,
      ...this.audit(actorUserId),
    });

    if (error) throw error;
    return Boolean(data);
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    let q = this.db.from("products").select("*");

    if (query) {
      const search = `%${query}%`;
      q = q.or(
        `name.ilike.${search},sku.ilike.${search},description.ilike.${search}`,
      );
    }
    if (category && category !== "all") {
      q = q.eq("category", category);
    }

    const { data, error } = await q.order("name");
    if (error) throw error;
    return (data as DbProduct[]).map(dbToProduct);
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await this.db.from("products").select("category");
    if (error) throw error;
    const categories = new Set<string>();
    for (const row of data as { category: string }[]) {
      categories.add(row.category);
    }
    return Array.from(categories).sort();
  }

  async getStats() {
    const { data, error } = await this.db.from("products").select("*");
    if (error) throw error;
    const products = (data as DbProduct[]).map(dbToProduct);
    return {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
      lowStockCount: products.filter(
        (p) => p.quantity > 0 && p.quantity <= p.lowStockThreshold,
      ).length,
      outOfStockCount: products.filter((p) => p.quantity === 0).length,
      categoriesCount: new Set(products.map((p) => p.category)).size,
    };
  }

  // ── Users ─────────────────────────────────────────────
  async getUsers(): Promise<SafeUser[]> {
    const { data, error } = await this.db
      .from("users")
      .select(USER_WITH_PERMISSIONS)
      .order("created_at");
    if (error) throw error;
    return (data as DbUser[]).map(dbToUser).map(toSafeUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.db
      .from("users")
      .select(USER_WITH_PERMISSIONS)
      .eq("id", id)
      .single();
    if (error) return undefined;
    return dbToUser(data as DbUser);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.db
      .from("users")
      .select(USER_WITH_PERMISSIONS)
      .ilike("username", username)
      .single();
    if (error) return undefined;
    return dbToUser(data as DbUser);
  }

  async createUser(
    insertUser: InsertUser,
    actorUserId: string,
  ): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);

    const { data, error } = await this.db.rpc("create_user_with_audit", {
      p_username: insertUser.username,
      p_password: hashedPassword,
      p_full_name: insertUser.full_name,
      p_rank: insertUser.rank,
      p_unit: insertUser.unit,
      p_callsign: insertUser.callsign ?? null,
      p_clearance_level: insertUser.clearanceLevel ?? "Без допуску",
      p_is_active: insertUser.isActive ?? true,
      ...this.audit(actorUserId),
    });

    if (error) throw error;

    const createdUserId = data as string;

    await this.setUserPermissions(
      createdUserId,
      insertUser.permissions,
      actorUserId,
    );

    const user = await this.getUser(createdUserId);
    if (!user) throw new Error("Failed to fetch created user");
    return toSafeUser(user);
  }

  async updateUser(
    id: string,
    updates: Partial<InsertUser>,
    actorUserId: string,
  ): Promise<SafeUser | undefined> {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.full_name !== undefined) {
      dbUpdates.full_name = updates.full_name;
    }
    if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.callsign !== undefined) {
      dbUpdates.callsign = updates.callsign ?? null;
    }
    if (updates.clearanceLevel !== undefined) {
      dbUpdates.clearance_level = updates.clearanceLevel;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }
    if (updates.password !== undefined) {
      dbUpdates.password = await bcrypt.hash(updates.password, 10);
    }

    if (Object.keys(dbUpdates).length) {
      const { data, error } = await this.db.rpc("update_user_with_audit", {
        p_user_id: id,
        p_updates: dbUpdates,
        ...this.audit(actorUserId),
      });

      if (error) throw error;
      if (!data) return undefined;
    }

    if (updates.permissions !== undefined) {
      await this.setUserPermissions(id, updates.permissions, actorUserId);
    }

    const user = await this.getUser(id);
    if (!user) return undefined;
    return toSafeUser(user);
  }

  async deleteUser(
    id: string,
    actorUserId: string,
  ): Promise<boolean> {
    const { data, error } = await this.db.rpc("delete_user_with_audit", {
      p_user_id: id,
      ...this.audit(actorUserId),
    });

    if (error) throw error;
    return Boolean(data);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async setUserPermissions(
    userId: string,
    permissions: Permission[],
    actorUserId: string,
  ): Promise<void> {
    const { error } = await this.db.rpc(
      "replace_user_permissions_with_audit",
      {
        p_user_id: userId,
        p_permission_keys: permissions,
        ...this.audit(actorUserId),
      },
    );

    if (error) throw error;
  }

  // ── Locations ────────────────────────────────────────

  async getLocations(filters?: { q?: string }): Promise<Location[]> {
    let query = this.db
      .from("locations")
      .select("*")
      .order("row", { ascending: true })
      .order("col", { ascending: true })
      .order("level", { ascending: true })
      .limit(50);

    if (filters?.q) {
      query = query.ilike("label", `%${filters.q}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // ── Product Locations ────────────────────────────────

  async getProductLocations(productId: string): Promise<ProductLocationView[]> {
    const { data, error } = await this.db
      .from("product_locations")
      .select(
        `
        id,
        product_id,
        location_id,
        quantity,
        updated_at,
        locations (
          label,
          row,
          col,
          level
        )
      `,
      )
      .eq("product_id", productId);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      locationId: row.location_id,
      quantity: row.quantity,
      updatedAt: row.updated_at,
      locationLabel: row.locations.label,
      locationRow: row.locations.row,
      locationCol: row.locations.col,
      locationLevel: row.locations.level,
    }));
  }

  async getProductLocation(
    productId: string,
    locationId: string,
  ): Promise<ProductLocation | null> {
    const { data } = await this.db
      .from("product_locations")
      .select("*")
      .eq("product_id", productId)
      .eq("location_id", locationId)
      .single();
    return data ?? null;
  }

  async createProductLocation(
    input: InsertProductLocation,
    actorUserId: string,
  ): Promise<ProductLocation> {
    const { data, error } = await this.db.rpc(
      "create_product_location_with_audit",
      {
        p_product_id: input.productId,
        p_location_id: input.locationId,
        p_quantity: input.quantity,
        ...this.audit(actorUserId),
      },
    );

    if (error) throw error;
    return data as ProductLocation;
  }

  async updateProductLocation(
    id: string,
    quantity: number,
    actorUserId: string,
  ): Promise<ProductLocation | null> {
    const { data, error } = await this.db.rpc(
      "update_product_location_with_audit",
      {
        p_id: id,
        p_quantity: quantity,
        ...this.audit(actorUserId),
      },
    );

    if (error) throw error;
    return (data as ProductLocation | null) ?? null;
  }

  async deleteProductLocation(
    id: string,
    actorUserId: string,
  ): Promise<boolean> {
    const { data, error } = await this.db.rpc(
      "delete_product_location_with_audit",
      {
        p_id: id,
        ...this.audit(actorUserId),
      },
    );

    if (error) throw error;
    return Boolean(data);
  }
}

export const storage = new SupabaseStorage();
