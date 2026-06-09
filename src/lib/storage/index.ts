import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../supabase";
import type { StorageContext } from "./shared";
import { createProductsStorage } from "./products";
import { createUsersStorage } from "./users";
import { createLocationsStorage } from "./locations";
import { createProductLocationsStorage } from "./product-locations";
import { createAuditStorage } from "./logs";

const PASSWORD_ROUNDS = 10;

const ctx: StorageContext = {
  db: () => getSupabase(),

  audit(actor_user_id: string) {
    if (!actor_user_id) {
      throw new Error("Missing actor_user_id for audited RPC call");
    }

    return {
      p_actor_user_id: actor_user_id,
      p_correlation_id: randomUUID(),
    };
  },

  async hashPassword(password: string) {
    return bcrypt.hash(password, PASSWORD_ROUNDS);
  },
};

export const storage = {
  ...createProductsStorage(ctx),
  ...createUsersStorage(ctx),
  ...createLocationsStorage(ctx),
  ...createProductLocationsStorage(ctx),
  ...createAuditStorage(ctx),
};

export type {
  UpdateUserInput,
  AuditAction,
  AuditLogFilters,
  AuditLogItem,
} from "./shared";
export { toSafeUser } from "./shared";
