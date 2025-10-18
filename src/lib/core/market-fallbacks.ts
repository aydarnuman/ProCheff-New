/**
 * Fallback Strategies for Market Data
 * Provides robust alternatives when market APIs fail
 */

import { ErrorCode, FallbackStrategy, ProCheffError } from './error-handling'

// Define the result type inline to match our core implementation
interface MarketFetchResult {
  success: boolean
  prices: Array<{
    item: string
    market: string
    price: number
    unit: string
    confidence: number
    source: string
    timestamp: string
  }>
  metadata: {
    totalItems: number
    marketsQueried: string[]
    processingTime: number
    cacheHit: boolean
    fallbackUsed?: boolean
    originalError?: string
  }
}

// Cached Market Data Fallback
export class CachedMarketDataFallback implements FallbackStrategy<MarketFetchResult> {
  priority = 100
  private cache = new Map<string, any>()
  private cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
  
  canHandle(error: ProCheffError): boolean {
    return error.code === ErrorCode.MARKET_FETCH_FAILED ||
           error.code === ErrorCode.MARKET_RATE_LIMITED ||
           error.code === ErrorCode.EXTERNAL_API_TIMEOUT
  }

  async execute(error: ProCheffError, originalInput: any): Promise<MarketFetchResult> {
    const { items, markets } = originalInput
    
    console.log('🔄 Attempting to use cached market data')
    
    const cachedPrices: any[] = []
    const now = Date.now()
    
    for (const item of items) {
      for (const market of markets) {
        const cacheKey = `${market}-${item}`
        const cached = this.cache.get(cacheKey)
        
        if (cached && (now - cached.timestamp) < this.cacheExpiry) {
          cachedPrices.push({
            ...cached.data,
            source: 'cache',
            timestamp: new Date().toISOString()
          })
        }
      }
    }
    
    if (cachedPrices.length > 0) {
      return {
        success: true,
        prices: cachedPrices,
        metadata: {
          totalItems: items.length,
          marketsQueried: markets,
          processingTime: 50,
          cacheHit: true,
          fallbackUsed: true,
          originalError: error.code
        }
      }
    }
    
    // If no cache available, throw error to try next fallback
    throw new Error('No cached data available')
  }

  updateCache(item: string, market: string, data: any) {
    const cacheKey = `${market}-${item}`
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }
}

// Historical Average Fallback
export class HistoricalAverageMarketFallback implements FallbackStrategy<MarketFetchResult> {
  priority = 80
  
  // Historical average prices for common Turkish grocery items (in TL)
  private historicalPrices: Record<string, number> = {
    // Proteins
    'tavuk': 28.50,
    'et': 85.00,
    'balık': 45.00,
    'yumurta': 18.00,
    'peynir': 35.00,
    'süt': 12.50,
    
    // Vegetables
    'domates': 8.50,
    'soğan': 6.00,
    'patates': 5.50,
    'havuç': 7.00,
    'salatalık': 9.00,
    'biber': 12.00,
    'marul': 8.00,
    
    // Grains & Staples
    'ekmek': 4.50,
    'pirinç': 15.00,
    'makarna': 12.00,
    'un': 8.00,
    'bulgur': 10.00,
    
    // Legumes
    'mercimek': 18.00,
    'nohut': 20.00,
    'fasulye': 22.00,
    
    // Common items
    'çay': 25.00,
    'kahve': 45.00,
    'şeker': 14.00,
    'tuz': 3.50,
    'yağ': 35.00
  }
  
  canHandle(error: ProCheffError): boolean {
    return error.code === ErrorCode.MARKET_FETCH_FAILED ||
           error.code === ErrorCode.EXTERNAL_API_TIMEOUT
  }

  async execute(error: ProCheffError, originalInput: any): Promise<MarketFetchResult> {
    const { items, markets } = originalInput
    
    console.log('🔄 Using historical average prices as fallback')
    
    const prices: any[] = []
    
    for (const item of items) {
      const basePrice = this.getHistoricalPrice(item)
      
      for (const market of markets) {
        // Add market-specific variation (±15%)
        const variation = (Math.random() - 0.5) * 0.3
        const marketPrice = basePrice * (1 + variation)
        
        prices.push({
          item,
          market,
          price: Math.round(marketPrice * 100) / 100,
          unit: this.getDefaultUnit(item),
          confidence: 0.6, // Medium confidence for historical data
          source: 'historical',
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return {
      success: true,
      prices,
      metadata: {
        totalItems: items.length,
        marketsQueried: markets,
        processingTime: 100,
        cacheHit: false,
        fallbackUsed: true,
        originalError: error.code
      }
    }
  }

  private getHistoricalPrice(item: string): number {
    const normalizedItem = item.toLowerCase().trim()
    
    // Direct match
    if (this.historicalPrices[normalizedItem]) {
      return this.historicalPrices[normalizedItem]
    }
    
    // Fuzzy matching for similar items
    const fuzzyMatches = Object.keys(this.historicalPrices).filter(key =>
      key.includes(normalizedItem) || normalizedItem.includes(key)
    )
    
    if (fuzzyMatches.length > 0) {
      return this.historicalPrices[fuzzyMatches[0]]
    }
    
    // Default price for unknown items
    return 15.00
  }

  private getDefaultUnit(item: string): string {
    const liquidItems = ['süt', 'yağ', 'sirke', 'limon suyu']
    const weightItems = ['et', 'tavuk', 'balık', 'peynir', 'domates', 'patates']
    const countItems = ['yumurta', 'ekmek', 'çay']
    
    const normalizedItem = item.toLowerCase()
    
    if (liquidItems.some(liquid => normalizedItem.includes(liquid))) {
      return 'lt'
    } else if (countItems.some(count => normalizedItem.includes(count))) {
      return 'adet'
    } else {
      return 'kg'
    }
  }
}

// Static Market Data Fallback
export class StaticMarketDataFallback implements FallbackStrategy<MarketFetchResult> {
  priority = 30
  
  canHandle(error: ProCheffError): boolean {
    return true // Can handle any market data error as last resort
  }

  async execute(error: ProCheffError, originalInput: any): Promise<MarketFetchResult> {
    const { items, markets } = originalInput
    
    console.log('🔄 Using static market data fallback (last resort)')
    
    const prices: any[] = []
    
    for (const item of items) {
      for (const market of markets) {
        prices.push({
          item,
          market,
          price: 0,
          unit: 'kg',
          confidence: 0.1,
          source: 'fallback',
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return {
      success: true,
      prices,
      metadata: {
        totalItems: items.length,
        marketsQueried: markets,
        processingTime: 10,
        cacheHit: false,
        fallbackUsed: true,
        originalError: error.code
      }
    }
  }
}

// Export instances for immediate use
export const cachedMarketDataFallback = new CachedMarketDataFallback()
export const historicalAverageMarketFallback = new HistoricalAverageMarketFallback()
export const staticMarketDataFallback = new StaticMarketDataFallback()
