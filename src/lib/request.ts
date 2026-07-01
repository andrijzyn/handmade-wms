import type { NextRequest } from "next/server";

/**
 * Best-effort client IP extraction. Netlify (and most proxies) set
 * x-forwarded-for; there is no reliable request.ip on the Node runtime.
 */
export function getClientIp(req: NextRequest): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return req.headers.get("x-real-ip");
}
