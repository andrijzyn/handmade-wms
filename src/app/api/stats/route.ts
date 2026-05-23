import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/apiError";
import { requireAuth } from "@/lib/auth";
import { storage } from "@/lib/storage";

export const GET = withErrorHandling(async () => {
  const userOrResp = await requireAuth();
  if (userOrResp instanceof NextResponse) return userOrResp;

  const stats = await storage.getStats();
  return NextResponse.json(stats);
});
