import type {
  InsertProductLocation,
  ProductLocation,
  ProductLocationView,
} from "../schema";
import type { StorageContext, DbProductLocationViewRow } from "./shared";
import { dbToProductLocationView } from "./shared";

export function createProductLocationsStorage(ctx: StorageContext) {
  return {
    async getProductLocations(
      product_id: string,
    ): Promise<ProductLocationView[]> {
      const { data, error } = await ctx
        .db()
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
        .eq("product_id", product_id);

      if (error) throw error;

      return ((data ?? []) as DbProductLocationViewRow[]).map(
        dbToProductLocationView,
      );
    },

    async getProductLocation(
      product_id: string,
      location_id: string,
    ): Promise<ProductLocation | null> {
      const { data, error } = await ctx
        .db()
        .from("product_locations")
        .select("*")
        .eq("product_id", product_id)
        .eq("location_id", location_id)
        .single();

      if (error) return null;
      return (data as ProductLocation) ?? null;
    },

    async createProductLocation(
      input: InsertProductLocation,
      actor_user_id: string,
    ): Promise<ProductLocation> {
      const { data, error } = await ctx
        .db()
        .rpc("create_product_location_with_audit", {
          p_product_id: input.product_id,
          p_location_id: input.location_id,
          p_quantity: input.quantity,
          ...ctx.audit(actor_user_id),
        });

      if (error) throw error;
      return data as ProductLocation;
    },

    async updateProductLocation(
      id: string,
      quantity: number,
      actor_user_id: string,
    ): Promise<ProductLocation | null> {
      const { data, error } = await ctx
        .db()
        .rpc("update_product_location_with_audit", {
          p_id: id,
          p_quantity: quantity,
          ...ctx.audit(actor_user_id),
        });

      if (error) throw error;
      return (data as ProductLocation | null) ?? null;
    },

    async deleteProductLocation(
      id: string,
      actor_user_id: string,
    ): Promise<boolean> {
      const { data, error } = await ctx
        .db()
        .rpc("delete_product_location_with_audit", {
          p_id: id,
          ...ctx.audit(actor_user_id),
        });

      if (error) throw error;
      return Boolean(data);
    },
  };
}
