import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getSupabase } from "../supabase";
import type { StorageContext } from "./shared";
import { createProductsStorage } from "./products";
import { createUsersStorage } from "./users";
import { createLocationsStorage } from "./locations";
import { createProductLocationsStorage } from "./productLocations";
import { createAuditStorage } from "./logs";

const PASSWORD_ROUNDS = 10;

const ctx: StorageContext = {
  db: () => getSupabase(),

  audit(actorUserID: string) {
    if (!actorUserID) {
      throw new Error("Missing actorUserID for audited RPC call");
    }

    return {
      p_actorUserID: actorUserID,
      p_correlationID: randomUUID(),
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
