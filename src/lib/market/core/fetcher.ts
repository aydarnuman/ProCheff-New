/**
 * ProCheff Market Data Fetcher
 * Unified market data layer with caching and confidence scoring
 */

import { log } from "@/lib/utils/logger";
import { MarketPrice } from "./types";

// Market fetcher result type
export interface MarketFetchResult {
  success: boolean;
  data: MarketPrice[];
  confidence: number;
  source: 'cache' | 'api' | 'fallback';
  lastUpdated: string;
  error?: string;
  metadata: {
    requestedAt: string;
    processingTime: number;
    cacheHit: boolean;
    marketCount: number;
  };
}

// Cache entry type
interface CacheEntry {
  data: MarketPrice[];
  timestamp: number;
  source: string;
}

// In-memory cache (production'da Redis kullanılmalı)
const PRICE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 saat

// Market adaptörleri
import { fetchA101Prices } from "../adapters/market-a101";
import { fetchBIMPrices } from "../adapters/market-bim";
import { fetchMigrosPrices } from "../adapters/market-migros";
import { fetchSOKPrices } from "../adapters/market-sok";

const MARKET_ADAPTERS = {
  'a101': fetchA101Prices,
  'bim': fetchBIMPrices,
  'migros': fetchMigrosPrices,
  'sok': fetchSOKPrices,
} as const;

type MarketName = keyof typeof MARKET_ADAPTERS;

/**
 * Ana market fetcher fonksiyonu
 */
export async function fetchMarketPrices(
  options: {
    markets?: MarketName[];
    useCache?: boolean;
    fallbackOnError?: boolean;
  } = {}
): Promise<MarketFetchResult> {
  const startTime = Date.now();
  const { 
    markets = ['a101', 'bim', 'migros', 'sok'], 
    useCache = true, 
    fallbackOnError = true 
  } = options;

  try {
    log.info('Market prices fetch started', { markets, useCache, fallbackOnError });

    // Cache kontrolü
    if (useCache) {
      const cacheResult = checkCache(markets);
      if (cacheResult) {
        return {
          success: true,
          data: cacheResult.data,
          confidence: calculateCacheConfidence(cacheResult.timestamp),
          source: 'cache',
          lastUpdated: new Date(cacheResult.timestamp).toISOString(),
          metadata: {
            requestedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            cacheHit: true,
            marketCount: markets.length
          }
        };
      }
    }

    // API'lerden çek
    const apiResult = await fetchFromAPIs(markets);
    
    if (apiResult.success && apiResult.data.length > 0) {
      // Cache'e kaydet
      if (useCache) {
        updateCache(markets, apiResult.data);
      }

      return {
        ...apiResult,
        metadata: {
          requestedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          cacheHit: false,
          marketCount: markets.length
        }
      };
    }

    // API başarısız, fallback kullan
    if (fallbackOnError) {
      const fallbackData = generateFallbackPrices(markets);
      return {
        success: true,
        data: fallbackData,
        confidence: 0.3,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        metadata: {
          requestedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          cacheHit: false,
          marketCount: markets.length
        }
      };
    }

    return createErrorResult('All fetch methods failed', startTime, markets.length);

  } catch (error) {
    log.error('Market fetch failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return createErrorResult(
      error instanceof Error ? error.message : 'Unknown error',
      startTime,
      markets.length
    );
  }
}

/**
 * Belirli bir market'ten fiyat çek
 */
export async function fetchSingleMarket(
  marketName: MarketName,
  options: { useCache?: boolean } = {}
): Promise<MarketFetchResult> {
  return fetchMarketPrices({
    markets: [marketName],
    ...options
  });
}

/**
 * Cache kontrolü
 */
function checkCache(markets: MarketName[]): CacheEntry | null {
  const cacheKey = markets.sort().join('-');
  const cached = PRICE_CACHE.get(cacheKey);
  
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    PRICE_CACHE.delete(cacheKey);
    return null;
  }
  
  return cached;
}

/**
 * Cache güncelle
 */
function updateCache(markets: MarketName[], data: MarketPrice[]): void {
  const cacheKey = markets.sort().join('-');
  PRICE_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
    source: 'api'
  });
  
  log.info('Price cache updated', { markets: cacheKey, items: data.length });
}

/**
 * API'lerden paralel çekme
 */
async function fetchFromAPIs(markets: MarketName[]): Promise<Omit<MarketFetchResult, 'metadata'>> {
  const promises = markets.map(async (market) => {
    try {
      const adapter = MARKET_ADAPTERS[market];
      const prices = await adapter();
      return prices;
    } catch (error) {
      log.warn(`${market} fetch failed`, { error: error instanceof Error ? error.message : 'Unknown' });
      return [];
    }
  });

  try {
    const results = await Promise.all(promises);
    const allPrices = results.flat();
    
    if (allPrices.length === 0) {
      return {
        success: false,
        data: [],
        confidence: 0,
        source: 'api',
        lastUpdated: new Date().toISOString(),
        error: 'No prices fetched from any market'
      };
    }

    // Confidence hesaplama: başarılı market sayısı / toplam market sayısı
    const successfulMarkets = results.filter(result => result.length > 0).length;
    const confidence = successfulMarkets / markets.length;

    return {
      success: true,
      data: allPrices,
      confidence: Math.max(0.1, confidence * 0.9), // Max 0.9 for API data
      source: 'api',
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      data: [],
      confidence: 0,
      source: 'api',
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'API fetch failed'
    };
  }
}

/**
 * Fallback prices generator
 */
function generateFallbackPrices(markets: MarketName[]): MarketPrice[] {
  const baseProducts = [
    'Pirinç (Baldo)', 'Dana Kıyma', 'Tavuk But', 'Domates', 'Soğan', 'Patates'
  ];
  
  const today = new Date().toISOString().split('T')[0];
  const fallbackPrices: MarketPrice[] = [];

  markets.forEach(market => {
    baseProducts.forEach(product => {
      fallbackPrices.push({
        source: market.toUpperCase(),
        product,
        unit: 'kg',
        price: getBaseFallbackPrice(product, market),
        date: today,
        confidence: 0.2 // Low confidence for fallback
      });
    });
  });

  return fallbackPrices;
}

/**
 * Base fallback price hesaplayıcı
 */
function getBaseFallbackPrice(product: string, market: string): number {
  const basePrices: Record<string, number> = {
    'Pirinç (Baldo)': 42,
    'Dana Kıyma': 180,
    'Tavuk But': 85,
    'Domates': 25,
    'Soğan': 12,
    'Patates': 15
  };

  const marketMultipliers: Record<string, number> = {
    'migros': 1.15,
    'a101': 0.88,
    'bim': 0.85,
    'sok': 0.92
  };

  const basePrice = basePrices[product] || 50;
  const multiplier = marketMultipliers[market] || 1;
  
  return Math.round(basePrice * multiplier * 100) / 100;
}

/**
 * Cache confidence hesaplayıcı (freshness-based)
 */
function calculateCacheConfidence(timestamp: number): number {
  const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  
  // 0-1 saat: 0.9 confidence
  // 1-3 saat: 0.8 confidence  
  // 3-6 saat: 0.6 confidence
  if (ageInHours < 1) return 0.9;
  if (ageInHours < 3) return 0.8;
  if (ageInHours < 6) return 0.6;
  
  return 0.3; // Very old cache
}

/**
 * Error result helper
 */
function createErrorResult(
  error: string,
  startTime: number,
  marketCount: number
): MarketFetchResult {
  return {
    success: false,
    data: [],
    confidence: 0,
    source: 'fallback',
    lastUpdated: new Date().toISOString(),
    error,
    metadata: {
      requestedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      cacheHit: false,
      marketCount
    }
  };
}

/**
 * Cache statistics
 */
export function getCacheStats(): {
  entries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
} {
  const entries = Array.from(PRICE_CACHE.entries());
  
  if (entries.length === 0) {
    return { entries: 0, oldestEntry: null, newestEntry: null };
  }
  
  const timestamps = entries.map(([_, entry]) => entry.timestamp);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);
  
  return {
    entries: entries.length,
    oldestEntry: new Date(oldest).toISOString(),
    newestEntry: new Date(newest).toISOString()
  };
}

/**
 * Cache temizleme
 */
export function clearCache(): void {
  PRICE_CACHE.clear();
  log.info('Price cache cleared');
}
