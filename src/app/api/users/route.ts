import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { withErrorHandling, badRequest, conflict } from "@/lib/apiError";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { insertUserSchema } from "@/lib/schema";

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const userOrResp = await requirePermission(PERMISSIONS.READ_USERS);
  if (userOrResp instanceof NextResponse) return userOrResp;

  const users = await storage.getUsers();
  return NextResponse.json(users);
});

export const POST = withErrorHandling(
  async (req: NextRequest): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.WRITE_USERS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const body = await req.json();

    const parsed = insertUserSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation error", z.treeifyError(parsed.error));
    }

    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) {
      return conflict("This user already exists");
    }

    const created = await storage.createUser(parsed.data, userOrResp.id);
    return NextResponse.json(created, { status: 201 });
  },
);
