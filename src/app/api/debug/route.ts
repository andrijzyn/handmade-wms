
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandling, unauthorized } from "@/lib/apiError";

/**
 * Діагностичний ендпоінт — перевіряє підключення до Supabase.
 * GET /api/debug
 * ВИДАЛИТИ ПЕРЕД ПРОДАКШЕНОМ!
 */
export const GET = withErrorHandling(async (req) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_DATABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL ? "✅ set" : "❌ missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ set" : "❌ missing",
      SESSION_SECRET: process.env.SESSION_SECRET ? "✅ set" : "❌ missing (using default)",
    },
  };

  try {
    const db = getSupabase();

    // Перевірка: чи є таблиця users і чи є в ній дані
    const { data: users, error: usersError } = await db
      .from("users")
      .select("id, username, role, is_active")
      .limit(10);

    if (usersError) {
      result.users = { error: usersError.message, code: usersError.code, hint: usersError.hint };
    } else {
      result.users = { count: users?.length ?? 0, rows: users };
    }

    // Перевірка: чи є таблиця products
    const { count, error: productsError } = await db
      .from("products")
      .select("*", { count: "exact", head: true });

    if (productsError) {
      result.products = { error: productsError.message, code: productsError.code };
    } else {
      result.products = { count };
    }
  } catch (err: unknown) {
    result.supabase_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(result, { status: 200 });
});