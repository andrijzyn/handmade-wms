import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import {
    withErrorHandling,
    unauthorized,
    notFound,
    badRequest,
} from "@/lib/apiError";

const updateQuantitySchema = z.object({
    quantity: z.number().int().min(0, "Quantity must be 0 or more"),
});

export const PATCH = withErrorHandling(async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateQuantitySchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("Validation error", z.treeifyError(parsed.error));
    }

    const entry = await storage.updateProductLocation(id, parsed.data.quantity);
    if (!entry) return notFound("Product location not found");
    return NextResponse.json(entry);
});

export const DELETE = withErrorHandling(async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const deleted = await storage.deleteProductLocation(id);
    if (!deleted) return notFound("Product location not found");
    return NextResponse.json({ message: "Product location deleted" });
});