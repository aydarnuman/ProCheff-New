/**
 * ProCheff Simple Rate Limiting
 * Basit ama etkili IP-based rate limiting
 */

const requests = new Map<string, number[]>();

/**
 * Rate limit kontrolü
 * @param ip - Client IP adresi
 * @param limit - İzin verilen istek sayısı (default: 5)
 * @param windowMs - Zaman penceresi ms (default: 1000ms = 1 saniye)
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(ip: string, limit = 5, windowMs = 1000): boolean {
  const now = Date.now();

  // Bu IP'nin son isteklerini al ve zaman penceresi içindekileri filtrele
  const times = (requests.get(ip) || []).filter((t) => now - t < windowMs);

  // Yeni isteği ekle
  times.push(now);
  requests.set(ip, times);

  // Limit kontrolü
  return times.length <= limit;
}

/**
 * Client IP adresini request'ten çıkar
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloud Run headers
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
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: Request, ...args: any[]) => Promise<Response>,
  options: { limit?: number; windowMs?: number } = {}
) {
  const { limit = 5, windowMs = 1000 } = options;

  return async (request: Request, ...args: any[]): Promise<Response> => {
    const clientIP = getClientIP(request);

    if (!rateLimit(clientIP, limit, windowMs)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Rate limit exceeded",
            code: 429,
            type: "RATE_LIMIT_EXCEEDED",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(windowMs / 1000).toString(),
          },
        }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * Memory temizleme (opsiyonel - production'da Redis kullanılabilir)
 */
export function cleanupOldRequests(): void {
  const now = Date.now();
  const maxAge = 60000; // 1 dakikadan eski kayıtları sil

  requests.forEach((times, ip) => {
    const filtered = times.filter((t) => now - t < maxAge);
    if (filtered.length === 0) {
      requests.delete(ip);
    } else {
      requests.set(ip, filtered);
    }
  });
}

// Her 5 dakikada bir temizlik (production'da cron job olabilir)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldRequests, 5 * 60 * 1000);
}
