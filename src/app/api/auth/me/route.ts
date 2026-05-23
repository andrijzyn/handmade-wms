import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/apiError";
import { requireAuth } from "@/lib/auth";
import { toSafeUser } from "@/lib/storage";

export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const userOrResp = await requireAuth();
  if (userOrResp instanceof NextResponse) return userOrResp;

  return NextResponse.json(toSafeUser(userOrResp));
});
