import type {
  AuditLogFilters,
  AuditLogItem,
  DbAuditLogRow,
  StorageContext,
} from "./shared";
import { getUserDisplayMapByIds } from "./users-helpers";

function attachActorsToLogs(
  rows: DbAuditLogRow[],
  userMap: Map<string, { username: string | null; fullName: string | null }>,
): AuditLogItem[] {
  return rows.map((row) => {
    const actor = row.actor_user_id
      ? userMap.get(row.actor_user_id)
      : undefined;

    const payload =
      row.payload && typeof row.payload === "object" ? row.payload : null;

    const oldValues =
      payload && "oldValues" in payload
        ? (payload.oldValues as Record<string, unknown> | null)
        : payload && "old_values" in payload
          ? (payload.old_values as Record<string, unknown> | null)
          : null;

    const newValues =
      payload && "newValues" in payload
        ? (payload.newValues as Record<string, unknown> | null)
        : payload && "new_values" in payload
          ? (payload.new_values as Record<string, unknown> | null)
          : null;

    return {
      id: row.id,
      tableName: row.entity_type,
      recordId: row.entity_id,
      action: String(row.action).toUpperCase() as AuditLogItem["action"],
      actorUserId: row.actor_user_id,
      actorUsername: actor?.username ?? null,
      actorFullName: actor?.fullName ?? null,
      correlationId: row.correlation_id,
      oldValues,
      newValues,
      createdAt: row.created_at,
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
          actor_user_id,
          action,
          entity_type,
          entity_id,
          correlation_id,
          payload,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.tableName && filters.tableName !== "all") {
        query = query.eq("entity_type", filters.tableName);
      }

      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", String(filters.action).toLowerCase());
      }

      if (filters?.actorUserId) {
        query = query.eq("actor_user_id", filters.actorUserId);
      }

      if (filters?.q?.trim()) {
        const q = filters.q.trim();
        query = query.or(
          `entity_type.ilike.%${q}%,entity_id::text.ilike.%${q}%,correlation_id::text.ilike.%${q}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as DbAuditLogRow[];

      const actorIds = [...new Set(
        rows
          .map((row) => row.actor_user_id)
          .filter((id): id is string => Boolean(id))
      )];

      const userMap = await getUserDisplayMapByIds(ctx, actorIds);

      return attachActorsToLogs(rows, userMap);
    },
  };
}
