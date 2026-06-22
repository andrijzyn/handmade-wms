import bcrypt from "bcryptjs";
import type { InsertUser } from "../schema";
import type { Permission } from "../permissions";
import type { User, SafeUser } from "../userTypes";
import type {
  StorageContext,
  UpdateUserInput,
  UserUpdateDbPayload,
  DbUser,
} from "./shared";
import { USER_WITH_PERMISSIONS, dbToUser, hasKeys, toSafeUser } from "./shared";

async function buildUserUpdatePayload(
  ctx: StorageContext,
  updates: UpdateUserInput,
): Promise<UserUpdateDbPayload> {
  const payload: UserUpdateDbPayload = {};

  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.full_name !== undefined) payload.full_name = updates.full_name;
  if (updates.rank !== undefined) payload.rank = updates.rank;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.callsign !== undefined) payload.callsign = updates.callsign;
  if (updates.clearance_level !== undefined) {
    payload.clearance_level = updates.clearance_level;
  }
  if (updates.is_active !== undefined) {
    payload.is_active = updates.is_active;
  }

  const normalizedPassword = updates.password?.trim();
  if (normalizedPassword) {
    payload.password = await ctx.hashPassword(normalizedPassword);
  }

  return payload;
}

export function createUsersStorage(ctx: StorageContext) {
  const api = {
    async getUsers(): Promise<SafeUser[]> {
      const { data, error } = await ctx
        .db()
        .from("users")
        .select(USER_WITH_PERMISSIONS)
        .order("created_at");

      if (error) throw error;
      return (data as DbUser[]).map(dbToUser).map(toSafeUser);
    },

    async getUser(id: string): Promise<User | undefined> {
      const { data, error } = await ctx
        .db()
        .from("users")
        .select(USER_WITH_PERMISSIONS)
        .eq("id", id)
        .single();

      if (error) return undefined;
      return dbToUser(data as DbUser);
    },

    async getUserByUsername(username: string): Promise<User | undefined> {
      const { data, error } = await ctx
        .db()
        .from("users")
        .select(USER_WITH_PERMISSIONS)
        .ilike("username", username)
        .single();

      if (error) return undefined;
      return dbToUser(data as DbUser);
    },

    async createUser(
      insertUser: InsertUser,
      actor_user_id: string,
    ): Promise<SafeUser> {
      const hashedPassword = await ctx.hashPassword(insertUser.password);

      const { data, error } = await ctx.db().rpc("create_user_with_audit", {
        p_username: insertUser.username,
        p_password: hashedPassword,
        p_full_name: insertUser.full_name,
        p_rank: insertUser.rank,
        p_unit: insertUser.unit,
        p_callsign: insertUser.callsign ?? null,
        p_clearance_level: insertUser.clearance_level ?? "Без допуску",
        p_is_active: insertUser.is_active ?? true,
        ...ctx.audit(actor_user_id),
      });

      if (error) throw error;

      const created_user_id = data as string;

      await api.setUserPermissions(
        created_user_id,
        insertUser.permissions ?? [],
        actor_user_id,
      );

      const user = await api.getUser(created_user_id);
      if (!user) {
        throw new Error("Failed to fetch created user");
      }

      return toSafeUser(user);
    },

    async updateUser(
      id: string,
      updates: UpdateUserInput,
      actor_user_id: string,
    ): Promise<SafeUser | undefined> {
      const dbUpdates = await buildUserUpdatePayload(ctx, updates);

      if (hasKeys(dbUpdates)) {
        const { error } = await ctx.db().rpc("update_user_with_audit", {
          p_user_id: id,
          p_updates: dbUpdates,
          ...ctx.audit(actor_user_id),
        });

        if (error) throw error;
      }

      if (updates.permissions !== undefined) {
        await api.setUserPermissions(id, updates.permissions, actor_user_id);
      }

      const user = await api.getUser(id);
      return user ? toSafeUser(user) : undefined;
    },

    async deleteUser(id: string, actor_user_id: string): Promise<boolean> {
      const { data, error } = await ctx.db().rpc("delete_user_with_audit", {
        p_user_id: id,
        ...ctx.audit(actor_user_id),
      });

      if (error) throw error;
      return Boolean(data);
    },

    async validatePassword(user: User, password: string): Promise<boolean> {
      return bcrypt.compare(password, user.password);
    },

    async bumpSessionVersion(id: string): Promise<string> {
      const newVersion = crypto.randomUUID();
      const { error } = await ctx
        .db()
        .from("users")
        .update({ session_version: newVersion })
        .eq("id", id);
      if (error) throw error;
      return newVersion;
    },

    async setUserPermissions(
      user_id: string,
      permissions: Permission[],
      actor_user_id: string,
    ): Promise<void> {
      const { error } = await ctx
        .db()
        .rpc("replace_user_permissions_with_audit", {
          p_user_id: user_id,
          p_permission_keys: permissions,
          ...ctx.audit(actor_user_id),
        });

      if (error) throw error;
    },
  };

  return api;
}
