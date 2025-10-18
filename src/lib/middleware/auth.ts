/**
 * ProCheff API Authentication & Authorization System
 * Bearer token ve API key desteği
 */

import { log } from "../utils/logger";

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  expiresAt?: Date;
  createdAt: Date;
  lastUsed?: Date;
}

export interface AuthContext {
  apiKey?: ApiKey;
  permissions: string[];
  rateLimitOverride?: {
    windowMs: number;
    maxRequests: number;
  };
}

// In-memory API key store (production'da database kullanılmalı)
const API_KEYS: Map<string, ApiKey> = new Map();

// Default API keys (environment'dan yüklenebilir)
const DEFAULT_KEYS: ApiKey[] = [
  {
    id: "demo-001",
    key: "procheff_demo_key_001",
    name: "Demo Key",
    permissions: ["menu:read", "offer:read", "market:read"],
    rateLimit: { windowMs: 60000, maxRequests: 100 }, // 100/dakika
    createdAt: new Date(),
  },
  {
    id: "premium-001",
    key: "procheff_premium_key_001",
    name: "Premium Key",
    permissions: ["*"], // Tüm izinler
    rateLimit: { windowMs: 60000, maxRequests: 1000 }, // 1000/dakika
    createdAt: new Date(),
  },
];

// API keys'i initialize et
DEFAULT_KEYS.forEach((key) => API_KEYS.set(key.key, key));

/**
 * Authorization header'dan API key çıkar
 */
function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return null;
  }

  // Bearer token format: "Bearer procheff_xxx_yyy"
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return null;
  }

  return match[1];
}

/**
 * API key doğrula ve context oluştur
 */
function validateApiKey(apiKey: string): AuthContext | null {
  const keyData = API_KEYS.get(apiKey);

  if (!keyData) {
    return null;
  }

  // Expiry kontrolü
  if (keyData.expiresAt && keyData.expiresAt < new Date()) {
    log.securityEvent("api_key_expired", { keyId: keyData.id });
    return null;
  }

  // Last used güncelle
  keyData.lastUsed = new Date();
  API_KEYS.set(apiKey, keyData);

  return {
    apiKey: keyData,
    permissions: keyData.permissions,
    rateLimitOverride: keyData.rateLimit,
  };
}

/**
 * İzin kontrolü
 */
function hasPermission(context: AuthContext, requiredPermission: string): boolean {
  if (context.permissions.includes("*")) {
    return true; // Admin izni
  }

  return context.permissions.includes(requiredPermission);
}

/**
 * Permission helper'ları
 */
export const Permissions = {
  MENU_READ: "menu:read",
  MENU_WRITE: "menu:write",
  OFFER_READ: "offer:read",
  OFFER_WRITE: "offer:write",
  MARKET_READ: "market:read",
  MARKET_WRITE: "market:write",
  PIPELINE_READ: "pipeline:read",
  PIPELINE_WRITE: "pipeline:write",
  ADMIN: "*",
} as const;

/**
 * Authentication middleware
 */
export function withAuth(requiredPermissions: string[] = [], options: { optional?: boolean } = {}) {
  return function (
    handler: (request: Request, context?: AuthContext, ...args: any[]) => Promise<Response>
  ) {
    return async (request: Request, ...args: any[]): Promise<Response> => {
      const apiKey = extractApiKey(request);

      if (!apiKey) {
        if (options.optional) {
          // Opsiyonel auth - context olmadan devam et
          return handler(request, undefined, ...args);
        }

        log.securityEvent("auth_missing", {
          endpoint: new URL(request.url).pathname,
          ip: getClientIP(request),
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Authentication required",
              code: 401,
              type: "AUTHENTICATION_REQUIRED",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const authContext = validateApiKey(apiKey);

      if (!authContext) {
        log.securityEvent("auth_invalid", {
          endpoint: new URL(request.url).pathname,
          ip: getClientIP(request),
          keyPrefix: apiKey.substring(0, 10) + "...",
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Invalid API key",
              code: 401,
              type: "INVALID_API_KEY",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // İzin kontrolü
      for (const permission of requiredPermissions) {
        if (!hasPermission(authContext, permission)) {
          log.securityEvent("auth_forbidden", {
            endpoint: new URL(request.url).pathname,
            keyId: authContext.apiKey?.id,
            requiredPermission: permission,
            userPermissions: authContext.permissions,
          });

          return new Response(
            JSON.stringify({
              success: false,
              error: {
                message: "Insufficient permissions",
                code: 403,
                type: "INSUFFICIENT_PERMISSIONS",
                details: { required: permission },
              },
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Başarılı auth log
      log.info("API request authenticated", {
        endpoint: new URL(request.url).pathname,
        keyId: authContext.apiKey?.id,
        keyName: authContext.apiKey?.name,
      });

      return handler(request, authContext, ...args);
    };
  };
}

/**
 * API key management functions
 */
export const ApiKeyManager = {
  create: (keyData: Omit<ApiKey, "id" | "createdAt">): ApiKey => {
    const apiKey: ApiKey = {
      ...keyData,
      id: `key-${Date.now()}`,
      createdAt: new Date(),
    };

    API_KEYS.set(keyData.key, apiKey);

    log.info("API key created", {
      keyId: apiKey.id,
      keyName: apiKey.name,
      permissions: apiKey.permissions,
    });

    return apiKey;
  },

  revoke: (keyValue: string): boolean => {
    const deleted = API_KEYS.delete(keyValue);

    if (deleted) {
      log.info("API key revoked", {
        keyValue: keyValue.substring(0, 10) + "...",
      });
    }

    return deleted;
  },

  list: (): ApiKey[] => {
    return Array.from(API_KEYS.values()).map((key) => ({
      ...key,
      key: key.key.substring(0, 10) + "...", // Güvenlik için kısa göster
    }));
  },

  getUsageStats: (): Record<string, { lastUsed?: Date; usageCount: number }> => {
    const stats: Record<string, any> = {};

    API_KEYS.forEach((key, keyValue) => {
      stats[key.id] = {
        lastUsed: key.lastUsed,
        usageCount: 0, // Gerçek uygulamada usage tracking gerekli
      };
    });

    return stats;
  },
};

/**
 * Helper function
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
