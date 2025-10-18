/**
 * Integration Tests for Market Data API
 * Tests using centralized API routes configuration
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { API_ROUTES, getApiMethod, getApiUrl } from '../../src/lib/api/routes'

const API_TIMEOUT = 30000

const EXPECTED_MARKET_STRUCTURE = {
  success: true,
  data: expect.objectContaining({
    averagePrices: expect.any(Array),
    rawPrices: expect.any(Array)
  })
}

describe('Market Data API Integration', () => {
  beforeAll(async () => {
    // Production server is managed by global setup
    console.log('🎯 Using production test server')
    
    // Verify server is accessible
    try {
      const response = await fetch(getApiUrl('health'), { 
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      
      const health = await response.json()
      console.log('✅ Server health check passed:', health.status)
    } catch (error) {
      console.error('❌ Server health check failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Production server not accessible: ${errorMessage}`)
    }
  }, API_TIMEOUT)

  describe(`${getApiMethod('marketPrices')} ${API_ROUTES.marketPrices}`, () => {
    it('should fetch market prices for basic ingredients', async () => {
      const response = await fetch(
        `${getApiUrl('marketPrices')}?items=tavuk&markets=a101`,
        {
          method: getApiMethod('marketPrices'),
          signal: AbortSignal.timeout(API_TIMEOUT)
        }
      )

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toMatchObject(EXPECTED_MARKET_STRUCTURE)
      
      // Validate business logic
      expect(data.data.averagePrices.length).toBeGreaterThan(0)
      expect(data.data.rawPrices.length).toBeGreaterThan(0)
    }, API_TIMEOUT)

    it('should handle multiple items and markets', async () => {
      const response = await fetch(
        `${getApiUrl('marketPrices')}?items=tavuk,et,süt&markets=a101,bim`,
        {
          method: getApiMethod('marketPrices'),
          signal: AbortSignal.timeout(API_TIMEOUT)
        }
      )

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.averagePrices.length).toBeGreaterThan(0)
    }, API_TIMEOUT)
  })

  describe('Market Data Quality', () => {
    it('should provide consistent price data across markets', async () => {
      const response = await fetch(
        `${getApiUrl('marketPrices')}?items=tavuk&markets=a101,bim,migros,sok`,
        {
          method: getApiMethod('marketPrices'),
          signal: AbortSignal.timeout(API_TIMEOUT)
        }
      )

      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Validate price reasonableness
      for (const priceData of data.data.averagePrices) {
        expect(priceData.average).toBeGreaterThan(0)
        expect(priceData.sources.length).toBeGreaterThan(0)
      }
    }, API_TIMEOUT)
  })

  describe('Performance and Reliability', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      
      const response = await fetch(
        `${getApiUrl('marketPrices')}?items=tavuk,et&markets=a101,bim`,
        {
          method: getApiMethod('marketPrices'),
          signal: AbortSignal.timeout(API_TIMEOUT)
        }
      )

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(10000) // 10 seconds max for market data
      
      const data = await response.json()
      expect(data.success).toBe(true)
    }, API_TIMEOUT)
  })
})
