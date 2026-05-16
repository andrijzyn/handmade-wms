import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandling, unauthorized } from "@/lib/apiError";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json(user);
});
