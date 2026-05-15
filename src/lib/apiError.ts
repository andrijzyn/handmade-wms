import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

/**
 * Centralised error type for API routes.
 * It carries an HTTP status code and optional details that will be
 * serialised into the JSON body.
 */
export class ApiError extends Error {
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
 * Convert an {@link ApiError} into a NextResponse JSON payload.
 */
export function errorResponse(error: ApiError): NextResponse {
  const payload: Record<string, unknown> = { message: error.message };
  if (error.details !== undefined) payload.details = error.details;
  return NextResponse.json(payload, { status: error.status });
}

/**
 * Helper to create and throw an {@link ApiError}.
 */
export function raiseApiError(
  message: string,
  status: number,
  details?: unknown
): never {
  throw new ApiError(message, status, details);
}

/**
 * Common shortcuts – they throw an {@link ApiError} which will be caught by the
 * wrapper.
 */
export const unauthorized = () =>
  raiseApiError("Необхідна авторизація", 401);
export const forbidden = () =>
  raiseApiError("Недостатньо прав доступу", 403);
export const conflict = (msg: string, details?: unknown) =>
  raiseApiError(msg, 409, details);
export const badRequest = (msg: string, details?: unknown) =>
  raiseApiError(msg, 400, details);
export const notFound = (msg: string, details?: unknown) =>
  raiseApiError(msg, 404, details);

/**
 * Higher‑order wrapper that catches both {@link ApiError} and unexpected
 * exceptions, turning them into a uniform JSON response.
 */
export function withErrorHandling(
  handler: (...args: never[]) => Promise<NextResponse>
) {
  return async (...args: never[]) => {
    try {
      return await handler(...args);
    } catch (err) {
      // Known API error – just format it.
      if (err instanceof ApiError) {
        return errorResponse(err);
      }
        // Zod validation errors expose a `flatten` method.
        if (err instanceof ZodError) {
          const details = z.treeifyError(err);
          return errorResponse(
            new ApiError("Validation error", 400, { errors: details })
          );
        }
      // Fallback – internal server error.
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { message: "Server error", details: message },
        { status: 500 }
      );
    }
  };
}
