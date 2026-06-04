import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { storage } from "./storage";
import { hasPermission } from "./permissions";
import type { Permission } from "./permissions";
import type { User } from "./userTypes";
import { unauthorized, forbidden } from "./apiServerError";

export interface SessionData {
  userId?: string;
  sessionVersion?: string;
}

// ── Session config ────────────────────────────────────
export const sessionOptions: SessionOptions = {
  cookieName: "stockpulse_session",
  password:
    process.env.SESSION_SECRET ||
    "stockpulse-dev-secret-must-be-at-least-32-chars",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  },
};

// ── Get current session ───────────────────────────────
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// ── Get current user ──────────────────────────────────
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();

  if (!session.userId) return null;

  const user = await storage.getUser(session.userId);
  if (!user || !user.isActive) return null;

  // Check invalidation
  if (session.sessionVersion !== user.sessionVersion) return null;

  return user;
}

// ── Guards ────────────────────────────────────────────
export async function requireAuth(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return user;
}

export async function requirePermission(
  perm: Permission,
): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasPermission(user, perm)) return forbidden();
  return user;
}

export async function requireAnyPermission(
  perms: Permission[],
): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!perms.some((p) => hasPermission(user, p))) return forbidden();
  return user;
}
