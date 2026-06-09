import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertProductLocationSchema } from "@/lib/schema";
import {
  withErrorHandling,
  badRequest,
  notFound,
  conflict,
} from "@/lib/apiServerError";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

const MAX_LOCATIONS = 20;

// GET /api/products/[id]/locations
export const GET = withErrorHandling(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.READ_LOCATIONS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const { id } = await params;

    const product = await storage.getProduct(id);
    if (!product) return notFound("Product not found");

    const locations = await storage.getProductLocations(id);
    return NextResponse.json(locations.slice(0, MAX_LOCATIONS));
  },
);

// POST /api/products/[id]/locations
export const POST = withErrorHandling(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ): Promise<NextResponse> => {
    const userOrResp = await requirePermission(PERMISSIONS.WRITE_LOCATIONS);
    if (userOrResp instanceof NextResponse) return userOrResp;

    const { id } = await params;

    const product = await storage.getProduct(id);
    if (!product) return notFound("Product not found");

    const body = await req.json();

    const parsed = insertProductLocationSchema.safeParse({
      ...body,
      product_id: id,
    });
    if (!parsed.success) {
      return badRequest("Помилка валідації", z.treeifyError(parsed.error));
    }

    const existing = await storage.getProductLocation(
      id,
      parsed.data.location_id,
    );
    if (existing) {
      return conflict("This location is already assigned to the product");
    }

    const entry = await storage.createProductLocation(
      parsed.data,
      userOrResp.id,
    );
    return NextResponse.json(entry, { status: 201 });
  },
);
