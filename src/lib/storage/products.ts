import type { InsertProduct, Product } from "../schema";
import type { StorageContext, ProductUpdateDbPayload, DbProduct } from "./shared";
import { dbToProduct, hasKeys } from "./shared";

function buildProductUpdatePayload(
  updates: Partial<InsertProduct>,
): ProductUpdateDbPayload {
  const payload: ProductUpdateDbPayload = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.sku !== undefined) payload.sku = updates.sku;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.quantity !== undefined) payload.quantity = updates.quantity;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.low_stock_threshold !== undefined) {
    payload.low_stock_threshold = updates.low_stock_threshold;
  }
  if (updates.description !== undefined) {
    payload.description = updates.description;
  }

  return payload;
}

export function createProductsStorage(ctx: StorageContext) {
  const api = {
    async getProduct(id: string): Promise<Product | undefined> {
      const { data, error } = await ctx.db()
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return undefined;
      return dbToProduct(data as DbProduct);
    },

    async getProductBySku(sku: string): Promise<Product | undefined> {
      const { data, error } = await ctx.db()
        .from("products")
        .select("*")
        .eq("sku", sku)
        .single();

      if (error) return undefined;
      return dbToProduct(data as DbProduct);
    },

    async createProduct(
      insertProduct: InsertProduct,
      actor_user_id: string,
    ): Promise<Product> {
      const { data, error } = await ctx.db().rpc("create_product_with_audit", {
        p_name: insertProduct.name,
        p_sku: insertProduct.sku,
        p_category: insertProduct.category,
        p_quantity: insertProduct.quantity,
        p_price: insertProduct.price,
        p_low_stock_threshold: insertProduct.low_stock_threshold,
        p_description: insertProduct.description ?? null,
        ...ctx.audit(actor_user_id),
      });

      if (error) throw error;
      return dbToProduct(data as DbProduct);
    },

    async updateProduct(
      id: string,
      updates: Partial<InsertProduct>,
      actor_user_id: string,
    ): Promise<Product | undefined> {
      const dbUpdates = buildProductUpdatePayload(updates);

      if (!hasKeys(dbUpdates)) {
        return api.getProduct(id);
      }

      const { data, error } = await ctx.db().rpc("update_product_with_audit", {
        p_product_id: id,
        p_updates: dbUpdates,
        ...ctx.audit(actor_user_id),
      });

      if (error) throw error;
      if (!data) return undefined;

      return dbToProduct(data as DbProduct);
    },

    async deleteProduct(id: string, actor_user_id: string): Promise<boolean> {
      const { data, error } = await ctx.db().rpc("delete_product_with_audit", {
        p_product_id: id,
        ...ctx.audit(actor_user_id),
      });

      if (error) throw error;
      return Boolean(data);
    },

    async searchProducts(query: string, category?: string): Promise<Product[]> {
      let q = ctx.db().from("products").select("*");

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
    },

    async getCategories(): Promise<string[]> {
      const { data, error } = await ctx.db().from("products").select("category");

      if (error) throw error;

      const categories = new Set<string>();
      for (const row of data as { category: string }[]) {
        categories.add(row.category);
      }

      return Array.from(categories).sort();
    },

    async getStats() {
      const { data, error } = await ctx.db().from("products").select("*");

      if (error) throw error;

      const products = (data as DbProduct[]).map(dbToProduct);

      return {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
        lowStockCount: products.filter(
          (p) => p.quantity > 0 && p.quantity <= p.low_stock_threshold,
        ).length,
        outOfStockCount: products.filter((p) => p.quantity === 0).length,
        categoriesCount: new Set(products.map((p) => p.category)).size,
      };
    },
  };

  return api;
}
