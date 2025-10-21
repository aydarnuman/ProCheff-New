/**
 * Market Price Cache System
 * 7 günlük TTL ile piyasa fiyatları cache sistemi
 */

import { log } from "../utils/logger";

export interface MarketPriceData {
  ingredient_name: string;
  price_per_kg: number;
  currency: "TRY" | "USD" | "EUR";
  source: string;
  last_updated: Date;
  confidence: number; // 0.0-1.0
  region?: string;
}

export interface CacheEntry {
  key: string;
  data: MarketPriceData[];
  expires_at: Date;
  source: string;
  metadata?: Record<string, unknown>;
}

export class MarketPriceCache {
  private static instance: MarketPriceCache;
  private readonly TTL_DAYS = 7;
  private readonly FALLBACK_TTL_HOURS = 4; // Offline fallback cache

  public static getInstance(): MarketPriceCache {
    if (!MarketPriceCache.instance) {
      MarketPriceCache.instance = new MarketPriceCache();
    }
    return MarketPriceCache.instance;
  }

  /**
   * Ana piyasa fiyatları getirme fonksiyonu
   */
  async getMarketPrices(
    ingredients: string[],
    region: string = "ISTANBUL",
    forceRefresh: boolean = false
  ): Promise<MarketPriceData[]> {
    const cacheKey = this.generateCacheKey(ingredients, region);

    try {
      // 1. Cache'den kontrol et
      if (!forceRefresh) {
        const cached = await this.getCachedPrices(cacheKey);
        if (cached && cached.length > 0) {
          log.info("Market prices retrieved from cache", {
            cacheKey,
            itemCount: cached.length,
          });
          return cached;
        }
      }

      // 2. Gerçek piyasa verisi çek
      const freshPrices = await this.fetchFreshPrices(ingredients, region);

      // 3. Cache'e kaydet
      await this.savePricesToCache(cacheKey, freshPrices, region);

      log.info("Market prices updated and cached", {
        cacheKey,
        itemCount: freshPrices.length,
      });

      return freshPrices;
    } catch (error) {
      log.error("Market price fetch failed, trying fallback", {
        error: error instanceof Error ? error.message : String(error),
        cacheKey,
      });

      // 4. Hata durumunda offline fallback
      return this.getOfflineFallback(ingredients, region);
    }
  }

  /**
   * Cache'den fiyat getir
   */
  private async getCachedPrices(
    cacheKey: string
  ): Promise<MarketPriceData[] | null> {
    try {
      // Prisma'da JSON cache tablosu yok, basit approach
      const cached = await this.getFromInMemoryCache(cacheKey);

      if (cached && cached.expires_at > new Date()) {
        return cached.data;
      }

      return null;
    } catch (error) {
      log.error("Cache retrieval failed", {
        error: error instanceof Error ? error.message : String(error),
        cacheKey,
      });
      return null;
    }
  }

  /**
   * Taze piyasa verisi çek (simulasyon)
   */
  private async fetchFreshPrices(
    ingredients: string[],
    region: string
  ): Promise<MarketPriceData[]> {
    // Gerçek implementasyonda hal-istanbul.com, tgte.org.tr vb. sitelerden çekilir
    // Şimdilik simüle edilmiş veri döndürüyoruz

    const mockPrices: Record<string, number> = {
      Pirinç: 25.5,
      Bulgur: 18.75,
      Makarna: 12.3,
      "Tavuk Eti": 75.0,
      Kıyma: 180.0,
      Domates: 8.5,
      Soğan: 6.25,
      Patates: 4.75,
      Havuç: 7.5,
      Biber: 12.0,
      Zeytinyağı: 195.0,
      "Ayçiçek Yağı": 65.0,
      Un: 8.75,
      Şeker: 22.5,
      Tuz: 3.25,
      Karabiber: 125.0,
    };

    const results: MarketPriceData[] = [];

    for (const ingredient of ingredients) {
      const basePrice =
        mockPrices[ingredient] || this.estimatePrice(ingredient);

      // Regional multiplier
      const regionalMultiplier = this.getRegionalMultiplier(region);

      // Market variation (±15%)
      const variation = 0.85 + Math.random() * 0.3;

      const finalPrice = basePrice * regionalMultiplier * variation;

      results.push({
        ingredient_name: ingredient,
        price_per_kg: Number(finalPrice.toFixed(2)),
        currency: "TRY",
        source: this.getMarketSource(region),
        last_updated: new Date(),
        confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
        region,
      });
    }

    return results;
  }

  /**
   * Fiyatları cache'e kaydet
   */
  private async savePricesToCache(
    cacheKey: string,
    prices: MarketPriceData[],
    region: string
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + this.TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const cacheEntry: CacheEntry = {
      key: cacheKey,
      data: prices,
      expires_at: expiresAt,
      source: this.getMarketSource(region),
      metadata: {
        region,
        cached_at: new Date(),
        item_count: prices.length,
      },
    };

    // In-memory cache'e kaydet (gerçek implementasyonda Redis/Database)
    await this.saveToInMemoryCache(cacheKey, cacheEntry);
  }

  /**
   * Offline fallback fiyatları
   */
  private async getOfflineFallback(
    ingredients: string[],
    region: string
  ): Promise<MarketPriceData[]> {
    log.info("Using offline fallback prices", {
      ingredients: ingredients.length,
      region,
    });

    // Son 4 saatlik cache'e bak
    const fallbackKey = `fallback_${this.generateCacheKey(
      ingredients,
      region
    )}`;
    const fallbackCache = await this.getFromInMemoryCache(fallbackKey);

    if (fallbackCache && fallbackCache.expires_at > new Date()) {
      return fallbackCache.data;
    }

    // Hiç cache yoksa varsayılan fiyatlar
    return this.getDefaultPrices(ingredients, region);
  }

  /**
   * Varsayılan fiyat listesi
   */
  private getDefaultPrices(
    ingredients: string[],
    region: string
  ): MarketPriceData[] {
    const defaultPrices: Record<string, number> = {
      Pirinç: 24.0,
      Bulgur: 18.0,
      Makarna: 12.0,
      "Tavuk Eti": 70.0,
      Kıyma: 175.0,
      Domates: 8.0,
      Soğan: 6.0,
      Patates: 4.5,
      Havuç: 7.0,
      Biber: 11.0,
      Zeytinyağı: 190.0,
      "Ayçiçek Yağı": 60.0,
      Un: 8.5,
      Şeker: 22.0,
      Tuz: 3.0,
      Karabiber: 120.0,
    };

    return ingredients.map((ingredient) => ({
      ingredient_name: ingredient,
      price_per_kg: defaultPrices[ingredient] || 50.0, // Default fallback
      currency: "TRY" as const,
      source: "OFFLINE_FALLBACK",
      last_updated: new Date(),
      confidence: 0.6, // Lower confidence for fallback
      region,
    }));
  }

  /**
   * Cache key oluştur
   */
  private generateCacheKey(ingredients: string[], region: string): string {
    const sortedIngredients = [...ingredients].sort();
    const ingredientHash = Buffer.from(sortedIngredients.join(","))
      .toString("base64")
      .substring(0, 16);
    return `market_prices_${region}_${ingredientHash}`;
  }

  /**
   * Fiyat tahmini (bilinmeyen ürünler için)
   */
  private estimatePrice(ingredient: string): number {
    const lowerName = ingredient.toLowerCase();

    // Kategorik tahmin
    if (lowerName.includes("et") || lowerName.includes("tavuk")) {
      return 80.0; // Et ürünleri
    }
    if (lowerName.includes("yağ") || lowerName.includes("tereyağ")) {
      return 120.0; // Yağ ürünleri
    }
    if (lowerName.includes("sebze") || lowerName.includes("meyve")) {
      return 10.0; // Sebze/meyve
    }
    if (lowerName.includes("tahıl") || lowerName.includes("un")) {
      return 15.0; // Tahıl ürünleri
    }

    return 25.0; // Genel ortalama
  }

  /**
   * Bölgesel çarpan
   */
  private getRegionalMultiplier(region: string): number {
    const multipliers: Record<string, number> = {
      ISTANBUL: 1.0,
      ANKARA: 0.95,
      IZMIR: 0.98,
      ANTALYA: 1.05,
      TRABZON: 1.02,
      DIYARBAKIR: 0.92,
      KONYA: 0.88,
    };

    return multipliers[region.toUpperCase()] || 1.0;
  }

  /**
   * Market kaynağı
   */
  private getMarketSource(region: string): string {
    const sources: Record<string, string> = {
      ISTANBUL: "İstanbul Hal Müdürlüğü",
      ANKARA: "Ankara Hal Müdürlüğü",
      IZMIR: "İzmir Hal Müdürlüğü",
    };

    return sources[region.toUpperCase()] || "Piyasa Araştırması";
  }

  // In-memory cache implementation (basit versiyonu)
  private inMemoryCache = new Map<string, CacheEntry>();

  private async getFromInMemoryCache(key: string): Promise<CacheEntry | null> {
    return this.inMemoryCache.get(key) || null;
  }

  private async saveToInMemoryCache(
    key: string,
    entry: CacheEntry
  ): Promise<void> {
    this.inMemoryCache.set(key, entry);

    // Auto-cleanup expired entries
    setTimeout(() => {
      const cached = this.inMemoryCache.get(key);
      if (cached && cached.expires_at <= new Date()) {
        this.inMemoryCache.delete(key);
      }
    }, entry.expires_at.getTime() - Date.now());
  }
}

/**
 * Market fiyatları için yardımcı fonksiyon
 */
export async function getIngredientPrices(
  ingredients: string[],
  region: string = "ISTANBUL"
): Promise<MarketPriceData[]> {
  const cache = MarketPriceCache.getInstance();
  return cache.getMarketPrices(ingredients, region);
}

/**
 * Tek ürün fiyatı için hızlı fonksiyon
 */
export async function getIngredientPrice(
  ingredient: string,
  region: string = "ISTANBUL"
): Promise<number> {
  const prices = await getIngredientPrices([ingredient], region);
  return prices[0]?.price_per_kg || 25.0; // Fallback price
}
