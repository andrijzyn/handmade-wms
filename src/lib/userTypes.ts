import type { Permission } from "./permissions";

export interface User {
  id: string;
  username: string;
  password: string;
  full_name: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearance_level: string;
  permissions: Permission[];
  is_active: boolean;
  created_at: Date | null;
  session_version?: string;
}

export type SafeUser = Omit<User, "password">;
