import type { Permission } from "./permissions";

export interface User {
    id: string;
    username: string;
    password: string;
    full_name: string;
    rank: string;
    unit: string;
    callsign: string | null;
    clearanceLevel: string;
    permissions: Permission[];
    isActive: boolean;
    createdAt: Date | null;
    sessionVersion: string | null;
}

export type SafeUser = Omit<User, "password">;