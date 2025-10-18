/**
 * Integration Tests for Menu Analysis API
 * Tests using centralized API routes configuration
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { API_ROUTES, getApiMethod, getApiUrl } from '../../src/lib/api/routes'

// Test configuration
const API_TIMEOUT = 30000

// Test data
const MOCK_MENU_TEXT = `
RESTORAN MENÜSÜ

Ana Yemekler:
- Tavuk Şiş (25 TL)
- Et Döner (30 TL) 
- Balık Izgara (35 TL)
- Mercimek Köfte (20 TL)

Çorbalar:
- Mercimek Çorbası (12 TL)
- Tavuk Çorbası (15 TL)

İçecekler:
- Çay (5 TL)
- Kahve (8 TL)
- Ayran (6 TL)
`

const EXPECTED_ANALYSIS_STRUCTURE = {
  success: true,
  data: expect.objectContaining({
    menuType: expect.any(String),
    totalItems: expect.any(Number),
    items: expect.arrayContaining([expect.any(Object)]),
    aiPowered: expect.any(Boolean)
  })
}

describe('Menu Analysis API Integration', () => {
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

  describe(`${getApiMethod('menuAnalyze')} ${API_ROUTES.menuAnalyze}`, () => {
    it('should analyze menu text successfully', async () => {
      const response = await fetch(getApiUrl('menuAnalyze'), {
        method: getApiMethod('menuAnalyze'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: MOCK_MENU_TEXT
        }),
        signal: AbortSignal.timeout(API_TIMEOUT)
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toMatchObject(EXPECTED_ANALYSIS_STRUCTURE)
      
      // Validate specific business logic
      expect(data.data.totalItems).toBeGreaterThan(0)
    }, API_TIMEOUT)

    it('should handle invalid menu text gracefully', async () => {
      const response = await fetch(getApiUrl('menuAnalyze'), {
        method: getApiMethod('menuAnalyze'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ''
        }),
        signal: AbortSignal.timeout(API_TIMEOUT)
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data).toMatchObject({
        success: false
      })
    }, API_TIMEOUT)
  })

  describe('Integration with Market Data', () => {
    it('should integrate menu analysis with market prices', async () => {
      // First analyze menu
      const menuResponse = await fetch(getApiUrl('menuAnalyze'), {
        method: getApiMethod('menuAnalyze'),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: MOCK_MENU_TEXT
        }),
        signal: AbortSignal.timeout(API_TIMEOUT)
      })

      const menuData = await menuResponse.json()
      expect(menuData.success).toBe(true)

      // Fetch market prices using GET method
      const marketResponse = await fetch(
        `${getApiUrl('marketPrices')}?items=tavuk&markets=a101`,
        {
          method: getApiMethod('marketPrices'),
          signal: AbortSignal.timeout(API_TIMEOUT)
        }
      )

      const marketData = await marketResponse.json()
      expect(marketData.success).toBe(true)

      // Validate data integration potential
      expect(menuData.data.totalItems).toBeGreaterThan(0)
      expect(marketData.data).toBeDefined()
    }, API_TIMEOUT)
  })

  describe('Performance and Reliability', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      
      const response = await fetch(getApiUrl('menuAnalyze'), {
        method: getApiMethod('menuAnalyze'),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: MOCK_MENU_TEXT
        }),
        signal: AbortSignal.timeout(API_TIMEOUT)
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(15000) // 15 seconds max
    }, API_TIMEOUT)

    it('should handle concurrent requests properly', async () => {
      const requests = Array(3).fill(null).map(() =>
        fetch(getApiUrl('menuAnalyze'), {
          method: getApiMethod('menuAnalyze'),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: MOCK_MENU_TEXT
          }),
          signal: AbortSignal.timeout(API_TIMEOUT)
        })
      )

      const responses = await Promise.all(requests)
      
      for (const response of responses) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    }, API_TIMEOUT)
  })
})
