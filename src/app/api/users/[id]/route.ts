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
  notFound,
} from "@/lib/apiError";

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await params;
  const body = await req.json();
  const partial = insertUserSchema.partial().safeParse(body);
    if (!partial.success) {
      return badRequest("Помилка валідації", z.treeifyError(partial.error));
    }

    if (partial.data.username) {
      const existing = await storage.getUserByUsername(partial.data.username);
      if (existing && existing.id !== id) {
        return conflict("Користувач з таким логіном вже існує");
      }
    }

    const updated = await storage.updateUser(id, partial.data);
    if (!updated) return notFound("Користувача не знайдено");
    return NextResponse.json(updated);

});

export const DELETE = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const { id } = await params;

    // Prevent self-delete
    if (user.id === id) {
      return badRequest("Не можна видалити власний акаунт");
    }

    const deleted = await storage.deleteUser(id);
    if (!deleted) return notFound("Користувача не знайдено");
    return NextResponse.json({ message: "Користувача видалено" });

});
