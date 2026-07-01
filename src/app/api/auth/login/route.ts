import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertUserSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { getClientIp } from "@/lib/request";
import {
  withErrorHandling,
  badRequest,
  raiseApiError,
} from "@/lib/apiServerError";

// Схема для логіну: тільки username і password
const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export const POST = withErrorHandling(
  async (req: NextRequest): Promise<NextResponse> => {
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid login data", z.treeifyError(parsed.error));
    }

    const { username, password } = parsed.data;
    const ip = getClientIp(req);

    const rateLimit = await storage.checkLoginRateLimit(ip, username);
    if (!rateLimit.allowed) {
      raiseApiError(
        `Too many login attempts. Try again in about ${rateLimit.retryAfterSeconds}s.`,
        429,
      );
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      await storage.recordFailedLoginAttempt(ip, username);
      raiseApiError("Invalid username or password", 401);
    }

    if (!user.is_active) {
      await storage.recordFailedLoginAttempt(ip, username);
      raiseApiError("Account is deactivated", 401);
    }

    const valid = await storage.validatePassword(user, password);
    if (!valid) {
      await storage.recordFailedLoginAttempt(ip, username);
      raiseApiError("Invalid username or password", 401);
    }

    // Bump session_version to invalidate any existing sessions
    const newVersion = await storage.bumpSessionVersion(user.id);

    // Готуємо безпечного юзера для відповіді
    const { password: _pw, ...safeUser } = user;

    // Створюємо сесію
    const session = await getSession();
    session.user_id = user.id;
    session.session_version = newVersion;
    await session.save();

    return NextResponse.json(safeUser);
  },
);
