import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertUserSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { withErrorHandling, badRequest, raiseApiError } from "@/lib/apiError";

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

    const user = await storage.getUserByUsername(username);
    if (!user) {
      raiseApiError("Invalid username or password", 401);
    }

    if (!user.isActive) {
      raiseApiError("Account is deactivated", 401);
    }

    const valid = await storage.validatePassword(user, password);
    if (!valid) {
      raiseApiError("Invalid username or password", 401);
    }

    // Готуємо безпечного юзера для відповіді
    const { password: _pw, ...safeUser } = user;

    // Створюємо сесію
    const session = await getSession();
    session.userId = user.id;
    // Якщо в User є поле sessionVersion, встанови його тут
    // Інакше або прибери цю логіку, або додай поле в схему користувача
    // @ts-expect-error якщо TS ще не знає про це поле
    session.sessionVersion = user.sessionVersion;
    await session.save();

    return NextResponse.json(safeUser);
  },
);
