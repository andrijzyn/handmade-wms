import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import {withErrorHandling, badRequest, notFound} from "@/lib/apiError";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

const updateQuantitySchema = z.object({
    quantity: z.number().int().min(0, "Quantity must be 0 or more"),
});

export const PATCH = withErrorHandling(
    async (
        req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ): Promise<NextResponse> => {
        const userOrResp = await requirePermission(PERMISSIONS.WRITE_LOCATIONS);
        if (userOrResp instanceof NextResponse) return userOrResp;

        const { id } = await params;
        const body = await req.json();

        const parsed = updateQuantitySchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Validation error", z.treeifyError(parsed.error));
        }

        const entry = await storage.updateProductLocation(id, parsed.data.quantity);
        if (!entry) return notFound("Product location not found");

        return NextResponse.json(entry);
    }
);

export const DELETE = withErrorHandling(
    async (
        _req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ): Promise<NextResponse> => {
        const userOrResp = await requirePermission(PERMISSIONS.DELETE_LOCATIONS);
        if (userOrResp instanceof NextResponse) return userOrResp;

        const { id } = await params;
        const deleted = await storage.deleteProductLocation(id);
        if (!deleted) return notFound("Product location not found");

        return NextResponse.json({ message: "Product location deleted" });
    }
);