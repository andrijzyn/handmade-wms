import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertUserSchema } from "@/lib/schema";
import {
  withErrorHandling,
  badRequest,
  conflict,
  notFound,
} from "@/lib/apiError";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export const PATCH   = withErrorHandling(
    async (
        req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ): Promise<NextResponse> => {
      const userOrResp = await requirePermission(PERMISSIONS.WRITE_USERS);
      if (userOrResp instanceof NextResponse) return userOrResp;

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
    }
);

export const DELETE = withErrorHandling(
    async (
        req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ): Promise<NextResponse> => {
      const userOrResp = await requirePermission(PERMISSIONS.WRITE_USERS);
      if (userOrResp instanceof NextResponse) return userOrResp;
      const currentUser = userOrResp;

      const { id } = await params;

      // Забороняємо видаляти себе
      if (currentUser.id === id) {
        return badRequest("Не можна видалити власний акаунт");
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) return notFound("Користувача не знайдено");

      return NextResponse.json({ message: "Користувача видалено" });
    }
);