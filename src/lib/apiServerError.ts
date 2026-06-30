import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

/**
 * Centralised error type for API routes.
 * It carries an HTTP status code and optional details that will be
 * serialised into the JSON body.
 */
export class ApiServerError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Convert an {@link ApiServerError} into a NextResponse JSON payload.
 */
export function errorResponse(error: ApiServerError): NextResponse {
  const payload: Record<string, unknown> = { message: error.message };
  if (error.details !== undefined) payload.details = error.details;
  return NextResponse.json(payload, { status: error.status });
}

/**
 * Helper to create and throw an {@link ApiServerError}.
 */
export function raiseApiError(
  message: string,
  status: number,
  details?: unknown,
): never {
  throw new ApiServerError(message, status, details);
}

/**
 * Common shortcuts – they throw an {@link ApiServerError} which will be caught by the
 * wrapper.
 */
export const unauthorized = () => raiseApiError("Authorization required", 401);
export const forbidden = () =>
  raiseApiError("You do not have permissions to do that", 403);
export const conflict = (msg: string, details?: unknown) =>
  raiseApiError(msg, 409, details);
export const badRequest = (msg: string, details?: unknown) =>
  raiseApiError(msg, 400, details);
export const notFound = (msg: string, details?: unknown) =>
  raiseApiError(msg, 404, details);

/**
 * Higher‑order wrapper that catches both {@link ApiServerError} and unexpected
 * exceptions, turning them into a uniform JSON response.
 */
export function withErrorHandling<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
) {
  return async (...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err: any) {
      if (err instanceof ApiServerError) {
        return errorResponse(err);
      }
      // Zod validation errors expose a `flatten` method.
      if (err instanceof ZodError) {
        const details = z.treeifyError(err);
        return errorResponse(
          new ApiServerError("Validation error", 400, { errors: details }),
        );
      }
      const requestId = crypto.randomUUID();
      console.error(`[${requestId}]`, err);
      return NextResponse.json(
        { message: "Internal server error", requestId },
        { status: 500 },
      );
    }
  };
}
