import type { Location } from "../schema";
import type { StorageContext } from "./shared";

export function createLocationsStorage(ctx: StorageContext) {
  return {
    async getLocations(filters?: { q?: string }): Promise<Location[]> {
      let query = ctx
        .db()
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

      if (error) throw error;
      return (data ?? []) as Location[];
    },
  };
}
