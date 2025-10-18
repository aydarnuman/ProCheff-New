/**
 * ProCheff API Rate Limiting Middleware
 * DDoS koruması ve API kötüye kullanım önleme sistemi
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (production'da Redis kullanılabilir)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit ayarları
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 dakika
  maxRequests: 300, // Dakikada max 300 istek (saniyede ~5)
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Client IP adresini çıkar
 */
function getClientIP(request: Request): string {
  // Vercel/Cloud Run headers'ı kontrol et
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback
  return "unknown";
}

/**
 * Rate limit kontrolü
 */
export function checkRateLimit(request: Request): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
} {
  const clientIP = getClientIP(request);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  // Eski kayıtları temizle
  rateLimitStore.forEach((entry, ip) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  });

  let entry = rateLimitStore.get(clientIP);

  if (!entry || entry.resetTime < now) {
    // Yeni window başlat
    entry = {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
    rateLimitStore.set(clientIP, entry);

    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: `Rate limit exceeded. Max ${RATE_LIMIT_CONFIG.maxRequests} requests per minute.`,
    };
  }

  // İstek sayısını artır
  entry.count++;
  rateLimitStore.set(clientIP, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit headers'ını response'a ekle
 */
export function addRateLimitHeaders(
  response: Response,
  result: ReturnType<typeof checkRateLimit>
): Response {
  const headers = new Headers(response.headers);

  headers.set("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxRequests.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: Request, ...args: any[]) => Promise<Response>
): (request: Request, ...args: any[]) => Promise<Response> {
  return async (request: Request, ...args: any[]) => {
    const rateLimitResult = checkRateLimit(request);

    if (!rateLimitResult.allowed) {
      const errorResponse = new Response(
        JSON.stringify({
          success: false,
          error: {
            message: rateLimitResult.error,
            code: 429,
            type: "RATE_LIMIT_EXCEEDED",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": RATE_LIMIT_CONFIG.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(rateLimitResult.resetTime / 1000).toString(),
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );

      return errorResponse;
    }

    // Handler'ı çalıştır
    const response = await handler(request, ...args);

    // Rate limit headers'ını ekle
    return addRateLimitHeaders(response, rateLimitResult);
  };
}
