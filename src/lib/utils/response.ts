/**
 * ProCheff Standardized Response Utilities
 * Consistent JSON response format across all endpoints
 */

export interface ResponseError {
  message: string;
  code: number;
  type?: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  timestamp?: string;
  requestId?: string;
  version?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  panelData?: Record<string, unknown>;
  error?: ResponseError;
  meta?: ResponseMeta;
}

/**
 * Success response helper
 */
export function ok<T>(
  data: T,
  panelData?: Record<string, unknown>,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(panelData && { panelData }),
    ...(meta && {
      meta: {
        timestamp: new Date().toISOString(),
        version: process.env.GIT_SHA || "dev",
        ...meta,
      },
    }),
  };
}

/**
 * Error response helper
 */
export function fail(
  message: string,
  code = 500,
  type?: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      message,
      code,
      ...(type && { type }),
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.GIT_SHA || "dev",
    },
  };
}

/**
 * Validation error helper
 */
export function validationError(
  details: Record<string, unknown>
): ApiResponse<never> {
  return fail("Validation failed", 400, "VALIDATION_ERROR", details);
}

/**
 * Not found error helper
 */
export function notFound(resource: string = "Resource"): ApiResponse<never> {
  return fail(`${resource} not found`, 404, "NOT_FOUND");
}

/**
 * Unauthorized error helper
 */
export function unauthorized(
  message: string = "Authentication required"
): ApiResponse<never> {
  return fail(message, 401, "UNAUTHORIZED");
}

/**
 * Forbidden error helper
 */
export function forbidden(
  message: string = "Access denied"
): ApiResponse<never> {
  return fail(message, 403, "FORBIDDEN");
}

/**
 * Rate limit error helper
 */
export function rateLimited(retryAfter?: number): ApiResponse<never> {
  return fail(
    "Rate limit exceeded",
    429,
    "RATE_LIMIT_EXCEEDED",
    retryAfter ? { retryAfter } : undefined
  );
}

/**
 * Internal server error helper
 */
export function serverError(
  message: string = "Internal server error"
): ApiResponse<never> {
  return fail(message, 500, "INTERNAL_SERVER_ERROR");
}

/**
 * Response builder with HTTP Response object
 */
export function createResponse<T>(
  responseData: ApiResponse<T>,
  status?: number,
  headers?: Record<string, string>
): Response {
  const finalStatus =
    status || (responseData.success ? 200 : responseData.error?.code || 500);

  return new Response(JSON.stringify(responseData), {
    status: finalStatus,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Quick response creators
 */
export const respond = {
  ok: <T>(data: T, panelData?: Record<string, unknown>, meta?: ResponseMeta) =>
    createResponse(ok(data, panelData, meta)),

  fail: (
    message: string,
    code = 500,
    type?: string,
    details?: Record<string, unknown>
  ) => createResponse(fail(message, code, type, details)),

  validation: (details: Record<string, unknown>) =>
    createResponse(validationError(details)),

  notFound: (resource?: string) => createResponse(notFound(resource)),

  unauthorized: (message?: string) => createResponse(unauthorized(message)),

  forbidden: (message?: string) => createResponse(forbidden(message)),

  rateLimited: (retryAfter?: number) =>
    createResponse(
      rateLimited(retryAfter),
      429,
      retryAfter ? { "Retry-After": retryAfter.toString() } : {}
    ),

  serverError: (message?: string) => createResponse(serverError(message)),
};

/**
 * Panel data transformation helpers
 */
interface MenuAnalysis {
  menuType: string;
  totalItems: number;
  macroBalance: {
    protein: number;
    fat: number;
    carb: number;
  };
  warnings: string[];
}

interface MarketData {
  averagePrices?: Record<string, number>;
  laborCost?: number;
  overheadCost?: number;
  totalCost?: number;
}

interface OfferCalc {
  offerPrice: number;
  margin: number;
  competitorAnalysis: Record<string, unknown>;
}

export const panel = {
  menu: (menuAnalysis: MenuAnalysis) => ({
    type: menuAnalysis.menuType,
    items: menuAnalysis.totalItems,
    nutrition: {
      protein: menuAnalysis.macroBalance.protein,
      fat: menuAnalysis.macroBalance.fat,
      carb: menuAnalysis.macroBalance.carb,
    },
    warnings: menuAnalysis.warnings,
  }),

  costs: (marketData: MarketData) => ({
    materials: marketData.averagePrices || {},
    labor: marketData.laborCost || 0,
    overhead: marketData.overheadCost || 0,
    total: marketData.totalCost || 0,
  }),

  offer: (offerCalc: OfferCalc) => ({
    price: offerCalc.offerPrice,
    breakdown: offerCalc.competitorAnalysis || {},
    margin: offerCalc.margin || 0,
    threshold: {
      value: 0.93,
      met: offerCalc.margin > 0.15,
    },
  }),

  risks: (
    warnings: string[] = [],
    financial: Record<string, unknown>[] = [],
    compliance: Record<string, unknown>[] = []
  ) => ({
    nutritional: warnings,
    financial,
    compliance,
    level: warnings.length > 0 ? "medium" : "low",
  }),

  meta: (confidence: number = 85, processingTime?: number) => ({
    processedAt: new Date().toISOString(),
    confidence,
    ...(processingTime && { processingTime: `${processingTime}ms` }),
  }),
};
