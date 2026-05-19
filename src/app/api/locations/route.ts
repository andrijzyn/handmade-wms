import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandling, unauthorized } from "@/lib/apiError";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const locations = await storage.getLocations({ q });
  return NextResponse.json(locations);
});