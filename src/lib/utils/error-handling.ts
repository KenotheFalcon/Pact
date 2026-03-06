// Centralized error handling utilities

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(message, "PAYMENT_ERROR", 402);
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Standard success response format
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Format error for client response
 */
export function formatError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    success: false,
    error: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: unknown): AppError {
  const supabaseError = error as { code?: string; message?: string } | null;
  const code = supabaseError?.code;
  const message = supabaseError?.message || "Database operation failed";

  switch (code) {
    case "23505": // Unique violation
      return new ConflictError("A record with this information already exists");

    case "23503": // Foreign key violation
      return new ValidationError("Referenced record does not exist");

    case "23502": // Not null violation
      return new ValidationError("Required field is missing");

    case "22P02": // Invalid input syntax
      return new ValidationError("Invalid input format");

    case "PGRST116": // No rows returned
      return new NotFoundError();

    case "42501": // Insufficient privilege
      return new AuthorizationError();

    default:
      return new AppError(message, code || "DATABASE_ERROR", 500);
  }
}

/**
 * Async error wrapper for server actions
 */
export function withErrorHandling<
  T extends (...args: never[]) => Promise<unknown>
>(fn: T): (...args: Parameters<T>) => Promise<ApiResponse> {
  return async (...args: Parameters<T>): Promise<ApiResponse> => {
    try {
      const result = await fn(...args);
      return result as ApiResponse;
    } catch (error) {
      console.error("Action error:", error);
      return formatError(error);
    }
  };
}

/**
 * Log errors for monitoring
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  // In production, this would send to error tracking service (e.g., Sentry)
  console.error("Error:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }

    if (message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return "Please log in to continue.";
    }

    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Retry helper for operations that might fail temporarily
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors
      if (error instanceof AppError && error.statusCode < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError!;
}
