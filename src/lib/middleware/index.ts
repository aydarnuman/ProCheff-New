/**
 * ProCheff Unified Security Layer
 * Tüm güvenlik middleware'lerini birleştiren comprehensive layer
 */

import { withRateLimit } from "./rateLimiter";
import { withValidation } from "./validation";
import { withErrorBoundary } from "./errorHandler";
import { withMonitoring } from "./monitoring";
import { withAuth, Permissions, type AuthContext } from "./auth";
import { z } from "zod";
export interface SecurityConfig {
  auth?: {
    required?: boolean;
    permissions?: string[];
  };
  rateLimit?: {
    enabled?: boolean;
    windowMs?: number;
    maxRequests?: number;
  };
  validation?: {
    schema?: z.ZodSchema<unknown>;
  };
  monitoring?: {
    enabled?: boolean;
  };
  allowedMethods?: string[];
}

/**
 * Comprehensive security wrapper
 * Tüm güvenlik katmanlarını sıralı şekilde uygular
 */
export function withCompleteSecurity(
  handler: (
    request: Request,
    context?: AuthContext,
    ...args: unknown[]
  ) => Promise<Response>,
  config: SecurityConfig = {}
) {
  const {
    auth = { required: false, permissions: [] },
    rateLimit = { enabled: true },
    monitoring = { enabled: true },
    allowedMethods = ["GET", "POST"],
  } = config;

  let wrappedHandler: typeof handler = handler;

  // 1. Monitoring (en dış katman - tüm istekleri izler)
  if (monitoring.enabled) {
    wrappedHandler = withMonitoring(wrappedHandler);
  }

  // 2. Error Boundary (hata yakalama)
  wrappedHandler = withErrorBoundary(wrappedHandler);

  // 3. Rate Limiting
  if (rateLimit.enabled) {
    wrappedHandler = withRateLimit(wrappedHandler);
  }

  // 4. Method Validation
  const methodValidatedHandler = async (
    request: Request,
    context?: AuthContext,
    ...args: unknown[]
  ): Promise<Response> => {
    if (!allowedMethods.includes(request.method)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: `Method ${request.method} not allowed`,
            code: 405,
            type: "METHOD_NOT_ALLOWED",
            details: { allowedMethods },
          },
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            Allow: allowedMethods.join(", "),
          },
        }
      );
    }
    return wrappedHandler(request, context, ...args);
  };

  // 5. Authentication (eğer gerekli ise)
  let finalHandler = methodValidatedHandler;
  if (auth.required || auth.permissions?.length) {
    finalHandler = withAuth(auth.permissions || [], {
      optional: !auth.required,
    })(methodValidatedHandler);
  }

  // 6. Validation (en son - sadece geçerli istekler için)
  if (config.validation?.schema) {
    const validationHandler = withValidation(
      config.validation.schema,
      async (data: unknown, request: Request, ...args: unknown[]) => {
        // Extract context from args if it exists
        const context = args.find(
          (arg) => arg && typeof arg === "object" && "permissions" in arg
        ) as AuthContext | undefined;
        return finalHandler(request, context, ...args);
      }
    );

    finalHandler = async (
      request: Request,
      context?: AuthContext,
      ...args: unknown[]
    ) => {
      return validationHandler(request, context, ...args);
    };
  }

  return finalHandler;
}

/**
 * Preset security configurations
 */
export const SecurityPresets = {
  // Public endpoints (health, docs vb.)
  PUBLIC: {
    auth: { required: false },
    rateLimit: { enabled: true, maxRequests: 1000 }, // Gevşek limit
    monitoring: { enabled: true },
    allowedMethods: ["GET"],
  } as SecurityConfig,

  // Read-only API endpoints
  READ_ONLY: {
    auth: { required: true, permissions: ["*"] }, // En az read izni
    rateLimit: { enabled: true, maxRequests: 300 },
    monitoring: { enabled: true },
    allowedMethods: ["GET", "POST"],
  } as SecurityConfig,

  // Write operations
  WRITE_OPERATIONS: {
    auth: { required: true, permissions: [Permissions.ADMIN] },
    rateLimit: { enabled: true, maxRequests: 100 },
    monitoring: { enabled: true },
    allowedMethods: ["POST", "PUT", "PATCH"],
  } as SecurityConfig,

  // Menu analysis endpoints
  MENU_ANALYSIS: {
    auth: { required: true, permissions: [Permissions.MENU_READ] },
    rateLimit: { enabled: true, maxRequests: 200 },
    monitoring: { enabled: true },
    allowedMethods: ["POST"],
  } as SecurityConfig,

  // Offer calculation endpoints
  OFFER_CALCULATION: {
    auth: { required: true, permissions: [Permissions.OFFER_READ] },
    rateLimit: { enabled: true, maxRequests: 150 },
    monitoring: { enabled: true },
    allowedMethods: ["POST"],
  } as SecurityConfig,

  // Market data endpoints
  MARKET_DATA: {
    auth: { required: true, permissions: [Permissions.MARKET_READ] },
    rateLimit: { enabled: true, maxRequests: 500 }, // Market data daha sık erişilebilir
    monitoring: { enabled: true },
    allowedMethods: ["GET", "POST"],
  } as SecurityConfig,

  // Pipeline endpoints (comprehensive operations)
  PIPELINE: {
    auth: { required: true, permissions: [Permissions.PIPELINE_READ] },
    rateLimit: { enabled: true, maxRequests: 50 }, // Daha kısıtlı (resource intensive)
    monitoring: { enabled: true },
    allowedMethods: ["POST"],
  } as SecurityConfig,
};

/**
 * Quick security helpers
 */
type HandlerFunction = (
  request: Request,
  context?: AuthContext,
  ...args: unknown[]
) => Promise<Response>;

export const secureEndpoint = {
  public: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.PUBLIC),
  readOnly: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.READ_ONLY),
  menuAnalysis: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.MENU_ANALYSIS),
  offerCalc: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.OFFER_CALCULATION),
  marketData: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.MARKET_DATA),
  pipeline: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.PIPELINE),
  writeOps: (handler: HandlerFunction) =>
    withCompleteSecurity(handler, SecurityPresets.WRITE_OPERATIONS),
};

/**
 * Metrics endpoint için security layer
 */
export function withMetricsEndpoint(
  handler: (request: Request, context?: AuthContext) => Promise<Response>
) {
  return withCompleteSecurity(handler, {
    auth: { required: true, permissions: [Permissions.ADMIN] },
    rateLimit: { enabled: true, maxRequests: 60 }, // Dakikada 60 metrics çekimi
    monitoring: { enabled: false }, // Metrics endpoint kendi kendini izlemesin
    allowedMethods: ["GET"],
  });
}

/**
 * Development mode security (gevşek güvenlik)
 */
export function withDevSecurity(
  handler: (request: Request, context?: AuthContext) => Promise<Response>
) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev security cannot be used in production");
  }

  return withCompleteSecurity(handler, {
    auth: { required: false }, // Dev'de auth zorunlu değil
    rateLimit: { enabled: false }, // Dev'de rate limit yok
    monitoring: { enabled: true },
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
}

// Export all middleware components
export * from "./rateLimiter";
export * from "./validation";
export * from "./errorHandler";
export * from "./monitoring";
export * from "./auth";

// Export preset permissions
export { Permissions };
