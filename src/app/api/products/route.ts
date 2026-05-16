import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertProductSchema } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { withErrorHandling, unauthorized, badRequest, conflict } from "@/lib/apiError";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const rawQuery = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";

  // Normalise and validate the search term (max 100 chars after trimming)
  const cleanedQuery = rawQuery.replace(/\++/g, " ").trim();
  const querySchema = z.string().max(100, "Search term too long").optional();
  const parsed = querySchema.safeParse(cleanedQuery);
  if (!parsed.success) {
    // Bad request will be turned into a proper JSON error by withErrorHandling
    throw parsed.error;
  }

  const products = await storage.searchProducts(parsed.data ?? "", category);
  return NextResponse.json(products);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const parsed = insertProductSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation error", z.treeifyError(parsed.error));
  }

  const existing = await storage.getProductBySku(parsed.data.sku);
  if (existing) {
    return conflict("A product with this SKU already exists");
  }

  const product = await storage.createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
});
