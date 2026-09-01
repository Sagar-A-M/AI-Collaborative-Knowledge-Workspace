import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

/**
 * Creates a standard successful JSON response.
 */
export function successResponse<T>(
  data: T,
  status = 200,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status }
  );
}

/**
 * Creates a standard error JSON response.
 */
export function errorResponse(
  message: string,
  status = 500,
  code = "INTERNAL_SERVER_ERROR",
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Centralized API route error handler.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return errorResponse("Validation failed", 400, "VALIDATION_ERROR", formattedErrors);
  }

  console.error("Unhandled API Error:", error);
  return errorResponse("An unexpected internal error occurred", 500, "INTERNAL_SERVER_ERROR");
}
