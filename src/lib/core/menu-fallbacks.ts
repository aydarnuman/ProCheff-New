/**
 * Fallback Strategies for Menu Analysis
 * Provides robust alternatives when primary analysis methods fail
 */

import { ErrorCode, FallbackStrategy, ProCheffError } from './error-handling'

// Define the result type inline to match our core implementation
interface MenuAnalysisResult {
  success: boolean
  analysis: {
    categories: string[]
    items: Array<{ name: string; price: number; category: string }>
    totalItems: number
    priceRange: { min: number; max: number; average: number }
    insights: string[]
    aiPowered: boolean
    confidence: number
    source: string
    metadata: {
      timestamp: string
      processingTime: number
      fallbackUsed?: boolean
      originalError?: string
    }
  }
}

// Regex-based Menu Analysis Fallback
export class RegexMenuAnalysisFallback implements FallbackStrategy<MenuAnalysisResult> {
  priority = 100
  
  canHandle(error: ProCheffError): boolean {
    return error.code === ErrorCode.AI_SERVICE_UNAVAILABLE ||
           error.code === ErrorCode.MENU_ANALYSIS_FAILED
  }

  async execute(error: ProCheffError, originalInput: any): Promise<MenuAnalysisResult> {
    const { menuText } = originalInput
    
    console.log('🔄 Falling back to regex analysis for menu parsing')
    
    // Enhanced regex patterns for Turkish menu items
    const pricePattern = /(\d+(?:[.,]\d{2})?)\s*(?:TL|₺|lira)/gi
    const itemPattern = /^[\s-•*]*(.+?)[\s-]*(?:[\(（]?\s*(\d+(?:[.,]\d{2})?)\s*(?:TL|₺|lira)?\s*[\)）]?)?$/gm
    
    const items: Array<{ name: string; price: number; category: string }> = []
    const categories = new Set<string>()
    
    // Split text into sections
    const sections = menuText.split(/\n\s*\n/)
    let currentCategory = 'Genel'
    
    for (const section of sections) {
      const lines = section.trim().split('\n')
      
      // Check if first line is a category
      const firstLine = lines[0]?.trim()
      if (firstLine && !pricePattern.test(firstLine) && lines.length > 1) {
        currentCategory = firstLine.replace(/[:：]/g, '').trim()
        categories.add(currentCategory)
        lines.shift() // Remove category line
      }
      
      // Process remaining lines as items
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue
        
        const match = trimmedLine.match(itemPattern)
        if (match) {
          const name = match[1]?.trim()
          const priceStr = match[2]
          
          if (name) {
            let price = 0
            if (priceStr) {
              price = parseFloat(priceStr.replace(',', '.'))
            } else {
              // Try to find price in the line
              const priceMatch = trimmedLine.match(pricePattern)
              if (priceMatch) {
                price = parseFloat(priceMatch[1].replace(',', '.'))
              }
            }
            
            items.push({
              name: name.replace(/[-•*]\s*/, ''),
              price,
              category: currentCategory
            })
          }
        }
      }
    }
    
    // Calculate statistics
    const validPrices = items.filter(item => item.price > 0).map(item => item.price)
    const priceRange = validPrices.length > 0 ? {
      min: Math.min(...validPrices),
      max: Math.max(...validPrices),
      average: validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
    } : { min: 0, max: 0, average: 0 }
    
    // Generate basic insights
    const insights = [
      `Menüde ${items.length} ürün tespit edildi`,
      `${categories.size} kategori bulundu: ${Array.from(categories).join(', ')}`,
      validPrices.length > 0 
        ? `Fiyat aralığı: ${priceRange.min}₺ - ${priceRange.max}₺`
        : 'Fiyat bilgisi tam olarak çıkarılamadı'
    ]
    
    return {
      success: true,
      analysis: {
        categories: Array.from(categories),
        items,
        totalItems: items.length,
        priceRange,
        insights,
        aiPowered: false,
        confidence: items.length > 0 ? 0.7 : 0.3,
        source: 'regex',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - (originalInput.startTime || Date.now()),
          fallbackUsed: true,
          originalError: error.code
        }
      }
    }
  }
}

// Static Menu Template Fallback
export class StaticMenuTemplateFallback implements FallbackStrategy<MenuAnalysisResult> {
  priority = 50
  
  canHandle(error: ProCheffError): boolean {
    return error.code === ErrorCode.MENU_ANALYSIS_FAILED ||
           error.code === ErrorCode.MENU_TEXT_INVALID
  }

  async execute(error: ProCheffError, originalInput: any): Promise<MenuAnalysisResult> {
    console.log('🔄 Using static template fallback for menu analysis')
    
    // Provide a basic template response when all else fails
    const basicCategories = ['Ana Yemekler', 'İçecekler', 'Tatlılar']
    const basicItems = [
      { name: 'Menü Öğesi 1', price: 0, category: 'Ana Yemekler' },
      { name: 'Menü Öğesi 2', price: 0, category: 'Ana Yemekler' },
      { name: 'İçecek', price: 0, category: 'İçecekler' }
    ]
    
    return {
      success: true,
      analysis: {
        categories: basicCategories,
        items: basicItems,
        totalItems: basicItems.length,
        priceRange: { min: 0, max: 0, average: 0 },
        insights: [
          'Menü analizi tamamlanamadı',
          'Temel şablon kullanılıyor',
          'Lütfen menü metnini kontrol edin'
        ],
        aiPowered: false,
        confidence: 0.1,
        source: 'fallback',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - (originalInput.startTime || Date.now()),
          fallbackUsed: true,
          originalError: error.code
        }
      }
    }
  }
}
