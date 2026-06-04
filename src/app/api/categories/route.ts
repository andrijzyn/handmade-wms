import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "../../../lib/apiServerError";

export const GET = withErrorHandling(async () => {
  const userOrResp = await requireAuth();
  if (userOrResp instanceof NextResponse) return userOrResp;

  const categories = await storage.getCategories();
  return NextResponse.json(categories);
});
