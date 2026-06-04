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
    const actor = row.actorUserID
      ? userMap.get(row.actorUserID)
      : undefined;

    const payload =
      row.payload && typeof row.payload === "object" ? row.payload : null;

    const oldValues =
      payload && "oldValues" in payload
        ? (payload.oldValues as Record<string, unknown> | null)
        : payload && "oldValues" in payload
          ? (payload.oldValues as Record<string, unknown> | null)
          : null;

    const newValues =
      payload && "newValues" in payload
        ? (payload.newValues as Record<string, unknown> | null)
        : payload && "newValues" in payload
          ? (payload.newValues as Record<string, unknown> | null)
          : null;

    return {
      id: row.id,
      tableName: row.entityType,
      recordId: row.entityID,
      action: String(row.action).toUpperCase() as AuditLogItem["action"],
      actorUserId: row.actorUserID,
      actorUsername: actor?.username ?? null,
      actorFullName: actor?.fullName ?? null,
      correlationId: row.correlationID,
      oldValues,
      newValues,
      createdAt: row.createdAt,
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
          actorUserID,
          action,
          entityType,
          entityID,
          correlationID,
          payload,
          createdAt
        `)
        .order("createdAt", { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.tableName && filters.tableName !== "all") {
        query = query.eq("entityType", filters.tableName);
      }

      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", String(filters.action).toLowerCase());
      }

      if (filters?.actorUserId) {
        query = query.eq("actorUserID", filters.actorUserId);
      }

      if (filters?.q?.trim()) {
        const q = filters.q.trim();
        query = query.or(
          `entityType.ilike.%${q}%,entityID::text.ilike.%${q}%,correlationID::text.ilike.%${q}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as DbAuditLogRow[];

      const actorIds = [...new Set(
        rows
          .map((row) => row.actorUserID)
          .filter((id): id is string => Boolean(id))
      )];

      const userMap = await getUserDisplayMapByIds(ctx, actorIds);

      return attachActorsToLogs(rows, userMap);
    },
  };
}
