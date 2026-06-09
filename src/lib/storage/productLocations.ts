import type {
  InsertProductLocation,
  ProductLocation,
  ProductLocationView,
} from "../schema";
import type { StorageContext, DbProductLocationViewRow } from "./shared";
import { dbToProductLocationView } from "./shared";

export function createProductLocationsStorage(ctx: StorageContext) {
  return {
    async getProductLocations(productId: string): Promise<ProductLocationView[]> {
      const { data, error } = await ctx.db()
        .from("product_locations")
        .select(
          `
          id,
          productID,
          locationID,
          quantity,
          updatedAt,
          locations (
            label,
            row,
            col,
            level
          )
        `,
        )
        .eq("productID", productId);

      if (error) throw error;

      return ((data ?? []) as DbProductLocationViewRow[]).map(
        dbToProductLocationView,
      );
    },

    async getProductLocation(
      productId: string,
      locationId: string,
    ): Promise<ProductLocation | null> {
      const { data, error } = await ctx.db()
        .from("product_locations")
        .select("*")
        .eq("productID", productId)
        .eq("locationID", locationId)
        .single();

      if (error) return null;
      return (data as ProductLocation) ?? null;
    },

    async createProductLocation(
      input: InsertProductLocation,
      actorUserID: string,
    ): Promise<ProductLocation> {
      const { data, error } = await ctx.db().rpc(
        "create_product_location_with_audit",
        {
          p_product_id: input.productId,
          p_locationID: input.locationId,
          p_quantity: input.quantity,
          ...ctx.audit(actorUserID),
        },
      );

      if (error) throw error;
      return data as ProductLocation;
    },

    async updateProductLocation(
      id: string,
      quantity: number,
      actorUserID: string,
    ): Promise<ProductLocation | null> {
      const { data, error } = await ctx.db().rpc(
        "update_product_location_with_audit",
        {
          p_id: id,
          p_quantity: quantity,
          ...ctx.audit(actorUserID),
        },
      );

      if (error) throw error;
      return (data as ProductLocation | null) ?? null;
    },

    async deleteProductLocation(
      id: string,
      actorUserID: string,
    ): Promise<boolean> {
      const { data, error } = await ctx.db().rpc(
        "delete_product_location_with_audit",
        {
          p_id: id,
          ...ctx.audit(actorUserID),
        },
      );

      if (error) throw error;
      return Boolean(data);
    },
  };
}
