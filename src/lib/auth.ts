import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SafeUser } from "./schema";

export interface SessionData {
  user?: SafeUser;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "stockpulse-dev-secret-must-be-at-least-32-chars",
  cookieName: "stockpulse-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

