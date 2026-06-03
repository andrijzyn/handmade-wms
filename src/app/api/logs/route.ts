import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { requirePermission } from "@/lib/auth";
import { withErrorHandling, badRequest } from "@/lib/apiError";
import { PERMISSIONS } from "@/lib/permissions";

const auditLogQuerySchema = z.object({
  action: z.enum(["INSERT", "UPDATE", "DELETE", "all"]).optional(),
  actorUserID: z.uuid("Invalid actor user id").optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  q: z.string().trim().max(100, "Search term too long").optional(),
  tableName: z.string().trim().max(100).optional()
});

export const GET = withErrorHandling(
  async (req: NextRequest): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.READ_LOGS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const url = new URL(req.url);

    const parsed = auditLogQuerySchema.safeParse({
      q: url.searchParams.get("q") || undefined,
      tableName: url.searchParams.get("tableName") || undefined,
      action: url.searchParams.get("action") || undefined,
      actorUserID: url.searchParams.get("actorUserID") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return badRequest("Incorrect audit log query", z.treeifyError(parsed.error));
    }

    const logs = await storage.getAuditLogs(parsed.data);
    return NextResponse.json(logs);
  },
);
