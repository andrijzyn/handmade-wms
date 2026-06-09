import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requirePermission } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiServerError";
import { PERMISSIONS } from "@/lib/permissions";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const userOrResp = await requirePermission(PERMISSIONS.READ_LOCATIONS);
  if (userOrResp instanceof NextResponse) return userOrResp;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const locations = await storage.getLocations({ q });
  return NextResponse.json(locations);
});
