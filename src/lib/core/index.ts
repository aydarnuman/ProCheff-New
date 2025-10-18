/**
 * ProCheff Core System Integration
 * Brings together all enhanced modules with error handling and observability
 */

import { ErrorCode, errorHandler, ProCheffError } from './error-handling'
import {
    cachedMarketDataFallback,
    historicalAverageMarketFallback,
    staticMarketDataFallback
} from './market-fallbacks'
import { RegexMenuAnalysisFallback, StaticMenuTemplateFallback } from './menu-fallbacks'
import { logDataTransformation, observability, withObservability } from './observability'

// Initialize Error Handler with Fallback Strategies
function initializeErrorHandling() {
  // Menu Analysis Fallbacks
  errorHandler.registerFallback(ErrorCode.AI_SERVICE_UNAVAILABLE, new RegexMenuAnalysisFallback())
  errorHandler.registerFallback(ErrorCode.MENU_ANALYSIS_FAILED, new RegexMenuAnalysisFallback())
  errorHandler.registerFallback(ErrorCode.MENU_TEXT_INVALID, new StaticMenuTemplateFallback())
  
  // Market Data Fallbacks
  errorHandler.registerFallback(ErrorCode.MARKET_FETCH_FAILED, cachedMarketDataFallback)
  errorHandler.registerFallback(ErrorCode.MARKET_RATE_LIMITED, cachedMarketDataFallback)
  errorHandler.registerFallback(ErrorCode.EXTERNAL_API_TIMEOUT, historicalAverageMarketFallback)
  errorHandler.registerFallback(ErrorCode.MARKET_INVALID, staticMarketDataFallback)
  
  console.log('✅ Error handling and fallback strategies initialized')
}

// Enhanced Menu Analysis with Full Integration
export async function enhancedMenuAnalysis(
  menuText: string,
  options: {
    useAI?: boolean
    includeInsights?: boolean
    confidenceThreshold?: number
  } = {}
) {
  return await withObservability('menu-analysis', { menuText, options }, async (traceId) => {
    const startTime = Date.now()
    
    try {
      // Validation
      if (!menuText || menuText.trim().length === 0) {
        throw new ProCheffError({
          code: ErrorCode.MENU_TEXT_INVALID,
          message: 'Menu text is required and cannot be empty',
          timestamp: new Date().toISOString(),
          retryable: false,
          fallbackAvailable: true
        })
      }

      // Primary AI Analysis
      const aiResult = await errorHandler.handleWithFallback(
        async () => {
          if (!options.useAI) {
            throw new ProCheffError({
              code: ErrorCode.AI_SERVICE_UNAVAILABLE,
              message: 'AI analysis disabled by options',
              timestamp: new Date().toISOString(),
              retryable: false,
              fallbackAvailable: true
            })
          }

          // Simulate AI analysis (replace with actual Claude integration)
          logDataTransformation(
            traceId,
            'ai-analysis',
            { menuText },
            { stage: 'ai-processing' },
            0.9,
            1500
          )

          // Mock AI response
          return {
            success: true,
            analysis: {
              categories: ['Ana Yemekler', 'İçecekler', 'Tatlılar'],
              items: [
                { name: 'Tavuk Şiş', price: 25, category: 'Ana Yemekler' },
                { name: 'Et Döner', price: 30, category: 'Ana Yemekler' },
                { name: 'Çay', price: 5, category: 'İçecekler' }
              ],
              totalItems: 3,
              priceRange: { min: 5, max: 30, average: 20 },
              insights: ['AI-powered analysis completed successfully'],
              aiPowered: true,
              confidence: 0.95,
              source: 'ai',
              metadata: {
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
              }
            }
          }
        },
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        { menuText, options, startTime }
      )

      logDataTransformation(
        traceId,
        'final-result',
        { menuText },
        aiResult,
        aiResult.analysis.confidence,
        Date.now() - startTime
      )

      return aiResult

    } catch (error) {
      console.error('Enhanced menu analysis failed:', error)
      throw error
    }
  })
}

// Enhanced Market Data Fetching with Full Integration
export async function enhancedMarketDataFetch(
  items: string[],
  markets: string[]
) {
  return await withObservability('market-data-fetch', { items, markets }, async (traceId) => {
    const startTime = Date.now()
    
    try {
      // Validation
      if (!items || items.length === 0) {
        throw new ProCheffError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Items list is required and cannot be empty',
          timestamp: new Date().toISOString(),
          retryable: false,
          fallbackAvailable: false
        })
      }

      const validMarkets = ['a101', 'bim', 'migros', 'sok']
      const invalidMarkets = markets.filter(m => !validMarkets.includes(m))
      if (invalidMarkets.length > 0) {
        throw new ProCheffError({
          code: ErrorCode.MARKET_INVALID,
          message: `Invalid markets: ${invalidMarkets.join(', ')}`,
          context: { invalidMarkets, validMarkets },
          timestamp: new Date().toISOString(),
          retryable: false,
          fallbackAvailable: true
        })
      }

      // Primary Market Data Fetch
      const marketResult = await errorHandler.handleWithFallback(
        async () => {
          logDataTransformation(
            traceId,
            'market-api-calls',
            { items, markets },
            { stage: 'fetching' },
            0.8,
            500
          )

          // Simulate market data fetching
          const prices = []
          for (const item of items) {
            for (const market of markets) {
              prices.push({
                item,
                market,
                price: Math.round((Math.random() * 40 + 10) * 100) / 100,
                unit: 'kg',
                confidence: 0.85 + Math.random() * 0.15,
                source: 'api',
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
              processingTime: Date.now() - startTime,
              cacheHit: false
            }
          }
        },
        ErrorCode.MARKET_FETCH_FAILED,
        { items, markets, startTime }
      )

      logDataTransformation(
        traceId,
        'market-result',
        { items, markets },
        marketResult,
        0.9,
        Date.now() - startTime
      )

      return marketResult

    } catch (error) {
      console.error('Enhanced market data fetch failed:', error)
      throw error
    }
  })
}

// System Health Check
export async function systemHealthCheck() {
  try {
    const health = observability.getSystemHealth()
    const metrics = await observability.collectSystemMetrics()
    
    return {
      status: health.status,
      timestamp: new Date().toISOString(),
      system: health.metrics?.system || {},
      apiEndpoints: health.metrics?.apiEndpoints || {},
      aiServices: health.metrics?.aiServices || {},
      marketData: health.metrics?.marketData || {},
      issues: health.issues,
      uptime: process.uptime(),
      version: '1.0.0'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      version: '1.0.0'
    }
  }
}

// Initialize the core system
export function initializeProCheffCore() {
  try {
    initializeErrorHandling()
    
    // Start background metrics collection
    setInterval(async () => {
      try {
        await observability.collectSystemMetrics()
      } catch (error) {
        console.error('Metrics collection failed:', error)
      }
    }, 30000) // Every 30 seconds
    
    console.log('🚀 ProCheff Core System initialized successfully')
    console.log('   ✅ Error handling configured')
    console.log('   ✅ Fallback strategies registered') 
    console.log('   ✅ Observability monitoring started')
    console.log('   ✅ Background metrics collection active')
    
    return true
  } catch (error) {
    console.error('❌ ProCheff Core System initialization failed:', error)
    return false
  }
}

// Export everything needed
export {
    ErrorCode, errorHandler,
    observability, ProCheffError
}
