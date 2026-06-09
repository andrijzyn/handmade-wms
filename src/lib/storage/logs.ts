import type {
  AuditLogFilters,
  AuditLogItem,
  DbAuditLogRow,
  StorageContext,
} from "./shared";
import { getUserDisplayMapByIds } from "./users-helpers";

function attachActorsToLogs(
  rows: DbAuditLogRow[],
  userMap: Map<string, { username: string | null; full_name: string | null }>,
): AuditLogItem[] {
  return rows.map((row) => {
    const actor = row.actor_user_id
      ? userMap.get(row.actor_user_id)
      : undefined;

    return {
      id: row.id,
      table_name: row.table_name,
      record_id: row.record_id,
      action: String(row.action).toUpperCase() as AuditLogItem["action"],
      actor_user_id: row.actor_user_id,
      actorUsername: actor?.username ?? row.users?.[0]?.username ?? null,
      actorFullName: actor?.full_name ?? row.users?.[0]?.full_name ?? null,
      correlation_id: row.correlation_id,
      old_values: row.old_values,
      new_values: row.new_values,
      created_at: row.created_at,
    };
  });
}

export function createAuditStorage(ctx: StorageContext) {
  return {
    async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogItem[]> {
      let query = ctx
        .db()
        .from("logs")
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
          users (
            username,
            full_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.table_name && filters.table_name !== "all") {
        query = query.eq("table_name", filters.table_name);
      }

      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", String(filters.action).toUpperCase());
      }

      if (filters?.actor_user_id) {
        query = query.eq("actor_user_id", filters.actor_user_id);
      }

      if (filters?.q?.trim()) {
        const q = filters.q.trim();
        query = query.or(
          `table_name.ilike.%${q}%,record_id.ilike.%${q}%,correlation_id.ilike.%${q}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as DbAuditLogRow[];

      const actor_ids = [
        ...new Set(
          rows
            .map((row) => row.actor_user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const userMap = await getUserDisplayMapByIds(ctx, actor_ids);

      return attachActorsToLogs(rows, userMap);
    },
  };
}
