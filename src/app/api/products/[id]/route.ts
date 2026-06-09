import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertProductSchema } from "@/lib/schema";
import { requirePermission } from "@/lib/auth";
import {
  withErrorHandling,
  badRequest,
  conflict,
  notFound,
} from "@/lib/apiServerError";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/products/[id]
export const GET = withErrorHandling(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.READ_PRODUCTS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const { id } = await params;
    const product = await storage.getProduct(id);
    if (!product) return notFound("Product not found");
    return NextResponse.json(product);
  },
);

// PATCH /api/products/[id]
export const PATCH = withErrorHandling(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.WRITE_PRODUCTS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const { id } = await params;
    const body = await req.json();

    const partial = insertProductSchema.partial().safeParse(body);
    if (!partial.success) {
      return badRequest("Помилка валідації", z.treeifyError(partial.error));
    }

    if (partial.data.sku) {
      const existing = await storage.getProductBySku(partial.data.sku);
      if (existing && existing.id !== id) {
        return conflict("Продукт з таким SKU вже існує");
      }
    }

    const product = await storage.updateProduct(
      id,
      partial.data,
      userOrResp.id,
    );
    if (!product) return notFound("Product not found");

    return NextResponse.json(product);
  },
);

// DELETE /api/products/[id]
export const DELETE = withErrorHandling(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.DELETE_PRODUCTS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const { id } = await params;
    const deleted = await storage.deleteProduct(id, userOrResp.id);
    if (!deleted) return notFound("Product not found");

    return NextResponse.json({ message: "Product has been deleted" });
  },
);
