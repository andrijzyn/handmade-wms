import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertProductSchema } from "@/lib/schema";
import { requirePermission } from "@/lib/auth";
import { withErrorHandling, badRequest, conflict } from "@/lib/apiError";
import { PERMISSIONS } from "@/lib/permissions";

export const GET = withErrorHandling(
  async (req: NextRequest): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.READ_PRODUCTS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const url = new URL(req.url);
    const rawQuery = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || "";

    const cleanedQuery = rawQuery.replace(/\++/g, " ").trim();
    const querySchema = z.string().max(100, "Search term too long").optional();
    const parsed = querySchema.safeParse(cleanedQuery);

    if (!parsed.success) {
      return badRequest("Incorrect search query", z.treeifyError(parsed.error));
    }

    const products = await storage.searchProducts(parsed.data ?? "", category);
    return NextResponse.json(products);
  },
);

export const POST = withErrorHandling(
  async (req: NextRequest): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.WRITE_PRODUCTS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const body = await req.json();
    const parsed = insertProductSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validation error", z.treeifyError(parsed.error));
    }

    const existing = await storage.getProductBySku(parsed.data.sku);
    if (existing) {
      return conflict("A product with such a SKU already exists");
    }

    const product = await storage.createProduct(parsed.data, userOrResp.id);
    return NextResponse.json(product, { status: 201 });
  },
);
