/**
 * ProCheff Error Handling System
 * Standart hata formatı ve error boundary
 */

import { log } from "@/lib/utils/logger";
import { withRateLimit } from "./rateLimiter";

// Standart hata tipleri
export interface ApiError {
  message: string;
  code: number;
  type: string;
  details?: any;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  requestId?: string;
}

// Hata türleri enum
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
  PDF_PARSING_ERROR = "PDF_PARSING_ERROR",
  MENU_ANALYSIS_ERROR = "MENU_ANALYSIS_ERROR",
  MARKET_FETCH_ERROR = "MARKET_FETCH_ERROR",
  OFFER_CALCULATION_ERROR = "OFFER_CALCULATION_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  NOT_FOUND = "NOT_FOUND",
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
}

/**
 * Standart hata response oluşturucu
 */
export function createErrorResponse(
  message: string,
  code: number = 500,
  type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
  details?: any
): Response {
  const error: ApiError = {
    message,
    code,
    type,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  // Hata logla
  log.error("API Error", {
    error,
    userAgent: "unknown", // Request context'ten gelecek
    ip: "unknown",
  });

  return new Response(JSON.stringify(response), {
    status: code,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Bilinen hata türleri için özelleştirilmiş response'lar
 */
export const ErrorResponses = {
  validation: (details: any) =>
    createErrorResponse("Validation failed", 400, ErrorType.VALIDATION_ERROR, details),

  rateLimit: (retryAfter: number) =>
    createErrorResponse("Rate limit exceeded", 429, ErrorType.RATE_LIMIT_EXCEEDED, { retryAfter }),

  fileUpload: (message: string = "File upload failed") =>
    createErrorResponse(message, 400, ErrorType.FILE_UPLOAD_ERROR),

  pdfParsing: (message: string = "PDF parsing failed") =>
    createErrorResponse(message, 422, ErrorType.PDF_PARSING_ERROR),

  menuAnalysis: (message: string = "Menu analysis failed") =>
    createErrorResponse(message, 422, ErrorType.MENU_ANALYSIS_ERROR),

  marketFetch: (message: string = "Market data fetch failed") =>
    createErrorResponse(message, 503, ErrorType.MARKET_FETCH_ERROR),

  offerCalculation: (message: string = "Offer calculation failed") =>
    createErrorResponse(message, 422, ErrorType.OFFER_CALCULATION_ERROR),

  notFound: (resource: string = "Resource") =>
    createErrorResponse(`${resource} not found`, 404, ErrorType.NOT_FOUND),

  methodNotAllowed: (method: string, allowed: string[]) =>
    createErrorResponse(`Method ${method} not allowed`, 405, ErrorType.METHOD_NOT_ALLOWED, {
      allowedMethods: allowed,
    }),

  internal: (message: string = "Internal server error") =>
    createErrorResponse(message, 500, ErrorType.INTERNAL_SERVER_ERROR),
};

/**
 * Error boundary wrapper - tüm beklenmeyen hataları yakalar
 */
export function withErrorBoundary(
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Hata logla
      log.error("Unhandled API Error", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        url: request.url,
        method: request.method,
        userAgent: request.headers.get("user-agent") || "unknown",
        ip: getClientIP(request),
      });

      // Known error types için özel handling
      if (error instanceof Error) {
        if (error.message.includes("rate limit")) {
          return ErrorResponses.rateLimit(60);
        }
        if (error.message.includes("validation")) {
          return ErrorResponses.validation(error.message);
        }
        if (error.message.includes("PDF")) {
          return ErrorResponses.pdfParsing(error.message);
        }
      }

      // Fallback internal server error
      return ErrorResponses.internal("An unexpected error occurred");
    }
  };
}

/**
 * Method validation helper
 */
export function validateMethod(request: Request, allowedMethods: string[]): Response | null {
  if (!allowedMethods.includes(request.method)) {
    return ErrorResponses.methodNotAllowed(request.method, allowedMethods);
  }
  return null;
}

/**
 * Client IP helper (rate limiter'dan import edilebilir)
 */
function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * Composite middleware - error boundary + rate limit + validation
 */
export function withSecurity(
  handler: (request: Request, ...args: any[]) => Promise<Response>,
  options: {
    allowedMethods?: string[];
    rateLimit?: boolean;
    validation?: any;
  } = {}
) {
  const { allowedMethods = ["GET", "POST"], rateLimit = true } = options;

  let wrappedHandler = handler;

  // Error boundary (en dış katman)
  wrappedHandler = withErrorBoundary(wrappedHandler);

  // Rate limiting
  if (rateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler);
  }

  // Method validation
  const finalHandler = async (request: Request, ...args: any[]): Promise<Response> => {
    const methodError = validateMethod(request, allowedMethods);
    if (methodError) return methodError;

    return wrappedHandler(request, ...args);
  };

  return finalHandler;
}
