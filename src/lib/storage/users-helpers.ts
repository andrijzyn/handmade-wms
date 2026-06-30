import type { StorageContext, DbUser } from "./shared";

export type UserDisplayInfo = {
  username: string | null;
  full_name: string | null;
};

export async function getUserDisplayMapByIds(
  ctx: StorageContext,
  ids: string[],
): Promise<Map<string, UserDisplayInfo>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await ctx
    .db()
    .from("users")
    .select("id, username, full_name")
    .in("id", uniqueIds);

  if (error) throw error;

  type UserRow = Pick<DbUser, "id" | "username" | "full_name">;
  return new Map(
    (data as UserRow[]).map((user) => [
      user.id,
      {
        username: user.username ?? null,
        full_name: user.full_name ?? null,
      },
    ]),
  );
}
