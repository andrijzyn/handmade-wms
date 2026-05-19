import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { insertProductLocationSchema } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import {
    withErrorHandling,
    unauthorized,
    notFound,
    badRequest,
    conflict,
} from "@/lib/apiError";

export const GET = withErrorHandling(async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const product = await storage.getProduct(id);
    if (!product) return notFound("Product not found");

    const locations = await storage.getProductLocations(id);
    return NextResponse.json(locations.slice(0, 20));
});

export const POST = withErrorHandling(async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const product = await storage.getProduct(id);
    if (!product) return notFound("Product not found");

    const body = await req.json();
    const parsed = insertProductLocationSchema.safeParse({ ...body, productId: id });
    if (!parsed.success) {
        return badRequest("Validation error", z.treeifyError(parsed.error));
    }

    const existing = await storage.getProductLocation(id, parsed.data.locationId);
    if (existing) return conflict("This location is already assigned to the product");

    const entry = await storage.createProductLocation(parsed.data);
    return NextResponse.json(entry, { status: 201 });
});