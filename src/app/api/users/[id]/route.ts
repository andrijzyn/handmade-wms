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

export const PATCH = withErrorHandling(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.WRITE_USERS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const { id } = await params;
    const body = await req.json();

    const partial = insertUserSchema.partial().safeParse(body);
    if (!partial.success) {
      return badRequest("Validation error", z.treeifyError(partial.error));
    }

    if (partial.data.username) {
      const existing = await storage.getUserByUsername(partial.data.username);
      if (existing && existing.id !== id) {
        return conflict("This user already exists");
      }
    }

    const updated = await storage.updateUser(id, partial.data, userOrResp.id);
    if (!updated) return notFound("No user found");

    return NextResponse.json(updated);
  },
);

export const DELETE = withErrorHandling(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.WRITE_USERS);
    if (userOrResp instanceof NextResponse) return userOrResp;
    const currentUser = userOrResp;

    const { id } = await params;

    // Do not allow to remove yourself
    if (currentUser.id === id) {
      return badRequest("You can't delete your own account");
    }

    const deleted = await storage.deleteUser(id, userOrResp.id);
    if (!deleted) return notFound("No user found");

    return NextResponse.json({ message: "User has been deleted" });
  },
);
