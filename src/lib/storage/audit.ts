import type {
  AuditLogFilters,
  AuditLogItem,
  DbAuditLogRow,
  StorageContext,
} from "./shared";
import { dbToAuditLog } from "./shared";

export function createAuditStorage(ctx: StorageContext) {
  return {
    async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogItem[]> {
      let query = ctx.db()
        .from("audit_logs")
        .select(`
          id,
          table_name,
          record_id,
          action,
          actor_user_id,
          correlation_id,
          old_values,
          new_values,
          created_at,
          users:actor_user_id (
            username,
            full_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.tableName && filters.tableName !== "all") {
        query = query.eq("table_name", filters.tableName);
      }

      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", filters.action);
      }

      if (filters?.actorUserId) {
        query = query.eq("actor_user_id", filters.actorUserId);
      }

      if (filters?.q?.trim()) {
        const q = filters.q.trim();
        query = query.or(
          [
            `table_name.ilike.%${q}%`,
            `record_id.ilike.%${q}%`,
            `correlation_id.ilike.%${q}%`,
          ].join(","),
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return ((data ?? []) as DbAuditLogRow[]).map(dbToAuditLog);
    },
  };
}
