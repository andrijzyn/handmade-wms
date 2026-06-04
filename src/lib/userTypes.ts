import type { Permission } from "./permissions";

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  rank: string;
  unit: string;
  callsign: string | null;
  clearanceLevel: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date | null;
  sessionVersion?: string;
}

export type SafeUser = Omit<User, "password">;
