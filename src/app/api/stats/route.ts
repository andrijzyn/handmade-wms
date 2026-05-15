import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandling, unauthorized } from "@/lib/apiError";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const stats = await storage.getStats();
  return NextResponse.json(stats);
});
