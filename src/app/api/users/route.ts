import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertUserSchema } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  withErrorHandling,
  unauthorized,
  forbidden,
  badRequest,
  conflict,
} from "@/lib/apiError";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const users = await storage.getUsers();
  return NextResponse.json(users);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = await req.json();
  const parsed = insertUserSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Помилка валідації", z.treeifyError(parsed.error));
    }

  const existing = await storage.getUserByUsername(parsed.data.username);
  if (existing) {
    return conflict("Користувач з таким логіном вже існує");
  }

  const newUser = await storage.createUser(parsed.data);
  return NextResponse.json(newUser, { status: 201 });
});
