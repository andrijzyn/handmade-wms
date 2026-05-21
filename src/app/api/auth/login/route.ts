import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { loginSchema } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { withErrorHandling, badRequest, unauthorized, raiseApiError } from "@/lib/apiError";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid login data", z.treeifyError(parsed.error));
  }

  const user = await storage.getUserByUsername(parsed.data.username);
  if (!user) {
    return raiseApiError("Invalid username or password", 401);
  }
  if (!user.isActive) {
    return raiseApiError("Account is deactivated", 401);
  }

  const valid = await storage.validatePassword(user, parsed.data.password);
  if (!valid) {
    return raiseApiError("Invalid username or password", 401);
  }

  const { password: _, ...safeUser } = user;

  const session = await getSession();
  session.user = safeUser;
  await session.save();

  return NextResponse.json(safeUser);
}) as any;