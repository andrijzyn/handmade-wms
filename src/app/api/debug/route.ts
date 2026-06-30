import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requirePermission } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiServerError";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Діагностичний ендпоінт — перевіряє підключення до Supabase.
 * GET /api/debug
 * ВИДАЛИТИ ПЕРЕД ПРОДАКШЕНОМ!
 */
export const GET = withErrorHandling(async (req) => {
  const userOrResp = await requirePermission(PERMISSIONS.READ_DEBUG);
  if (userOrResp instanceof NextResponse) return userOrResp;

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_DATABASE_URL: process.env
        .NEXT_PUBLIC_SUPABASE_DATABASE_URL
        ? "✅ set"
        : "❌ missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "✅ set"
        : "❌ missing",
      SESSION_SECRET: process.env.SESSION_SECRET
        ? "✅ set"
        : "❌ missing (using default)",
    },
  };

  try {
    const db = getSupabase();

    const { data, error } = await db
      .from("users")
      .select(
        `
    id,
    username,
    is_active,
    user_permissions (
      permissions ( key )
    )
  `,
      )
      .limit(10);

    if (error) {
      result.users = {
        error: error.message,
        code: error.code,
        hint: error.hint,
      };
    } else {
      type DebugUserRow = {
        id: string;
        username: string;
        is_active: boolean;
        user_permissions: { permissions: { key: string } }[];
      };
      const usersWithPermissions = ((data ?? []) as unknown as DebugUserRow[]).map((row) => ({
        id: row.id,
        username: row.username,
        is_active: row.is_active,
        permissions: (row.user_permissions ?? []).map((up) => up.permissions.key),
      }));

      result.users = {
        count: usersWithPermissions.length,
        rows: usersWithPermissions,
      };
    }

    // Перевірка: чи є таблиця products
    const { count, error: productsError } = await db
      .from("products")
      .select("*", { count: "exact", head: true });

    if (productsError) {
      result.products = {
        error: productsError.message,
        code: productsError.code,
      };
    } else {
      result.products = { count };
    }
  } catch (err: unknown) {
    result.supabase_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(result, { status: 200 });
});
