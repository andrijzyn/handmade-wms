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

    return {
      id: row.id,
      tableName: row.tableName,
      recordID: row.recordID,
      action: String(row.action).toUpperCase() as AuditLogItem["action"],
      actorUserID: row.actorUserID,
      actorUsername: actor?.username ?? row.users?.[0]?.username ?? null,
      actorFullName: actor?.fullName ?? row.users?.[0]?.fullName ?? null,
      correlationID: row.correlationID,
      oldValues: row.oldValues,
      newValues: row.newValues,
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
          tableName,
          recordID,
          action,
          actorUserID,
          correlationID,
          oldValues,
          newValues,
          createdAt,
          users (
            username,
            fullName
          )
        `)
        .order("createdAt", { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.tableName && filters.tableName !== "all") {
        query = query.eq("tableName", filters.tableName);
      }

      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", String(filters.action).toUpperCase());
      }

      if (filters?.actorUserID) {
        query = query.eq("actorUserID", filters.actorUserID);
      }

      if (filters?.q?.trim()) {
        const q = filters.q.trim();
        query = query.or(
          `tableName.ilike.%${q}%,recordID.ilike.%${q}%,correlationID.ilike.%${q}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as DbAuditLogRow[];

      const actorIds = [
        ...new Set(
          rows
            .map((row) => row.actorUserID)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const userMap = await getUserDisplayMapByIds(ctx, actorIds);

      return attachActorsToLogs(rows, userMap);
    },
  };
}
