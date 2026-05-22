import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertProductSchema } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  withErrorHandling,
  unauthorized,
  notFound,
  badRequest,
  conflict,
} from "@/lib/apiError";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";

  const all = await storage.getLocations();
  const filtered = q
      ? all.filter((l) => l.label.toLowerCase().includes(q.toLowerCase()))
      : all;

  return NextResponse.json(filtered.slice(0, 20));
});

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const partial = insertProductSchema.partial().safeParse(body);
    if (!partial.success) {
      return badRequest("Validation error", z.treeifyError(partial.error));
    }

  if (partial.data.sku) {
    const existing = await storage.getProductBySku(partial.data.sku);
    if (existing && existing.id !== id) {
      return conflict("A product with this SKU already exists");
    }
  }

  const product = await storage.updateProduct(id, partial.data);
  if (!product) return notFound("Product not found");
  return NextResponse.json(product);
});

export const DELETE = withErrorHandling(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const deleted = await storage.deleteProduct(id);
  if (!deleted) return notFound("Product not found");
  return NextResponse.json({ message: "Product has been deleted" });
});
